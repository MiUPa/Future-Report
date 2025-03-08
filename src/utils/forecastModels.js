import TimeSeries from 'timeseries-analysis';
import ARIMA from 'arima';
import * as tf from '@tensorflow/tfjs';
import { Matrix } from 'ml-matrix';
import { PolynomialRegression } from 'ml-regression';

// 最大予測期間を3ヶ月(90日)に制限
const MAX_FORECAST_PERIOD = 90;

/**
 * SARIMA（季節性ARIMA）モデルを使用した予測
 * @param {Array} values - 予測に使用する時系列データの配列
 * @param {number} periods - 予測する期間数
 * @returns {Promise<Array>} - 予測結果の配列
 */
export const calculateSARIMA = async (values, periods) => {
  // 予測期間を制限
  const actualPeriods = Math.min(periods, MAX_FORECAST_PERIOD);
  
  if (!values || values.length < 4) {
    console.warn('データが不足しているため、SARIMAモデルは使用できません');
    return linearForecast(values, actualPeriods);
  }

  try {
    // ARIMAモデルの設定
    // p: 自己回帰項の次数, d: 差分の次数, q: 移動平均項の次数
    // P: 季節性自己回帰項の次数, D: 季節性差分の次数, Q: 季節性移動平均項の次数
    // m: 季節性の周期
    const arimaParams = {
      p: 1,
      d: 1,
      q: 1,
      P: 1,
      D: 0,
      Q: 0,
      m: 12 // 月次データの場合
    };

    // ARIMAモデルの学習と予測
    const arima = new ARIMA(arimaParams);
    
    // モデルの学習
    const [errors, params] = await arima.fit(values);
    
    // 将来の予測
    const [pred, errors2] = await arima.predict(actualPeriods);
    
    return pred;
  } catch (error) {
    console.error('SARIMAモデル予測エラー:', error);
    // エラーが発生した場合は単純な線形予測を返す
    return linearForecast(values, actualPeriods);
  }
};

/**
 * ETS（指数平滑状態空間）モデルを使用した予測
 * @param {Array} values - 予測に使用する時系列データの配列
 * @param {number} periods - 予測する期間数
 * @returns {Array} - 予測結果の配列
 */
export const calculateETS = (values, periods) => {
  // 予測期間を制限
  const actualPeriods = Math.min(periods, MAX_FORECAST_PERIOD);
  
  if (!values || values.length < 3) {
    return linearForecast(values, actualPeriods);
  }
  
  try {
    // 加法モデル（レベル + トレンド + 季節性）の設定
    const alpha = 0.3; // レベルのスムージングパラメータ
    const beta = 0.1;  // トレンドのスムージングパラメータ
    const gamma = 0.1; // 季節性のスムージングパラメータ
    const period = 12; // 季節性の周期（月次データの場合）
    
    // データの季節性パターンを抽出
    const seasons = [];
    if (values.length >= period) {
      for (let i = 0; i < period; i++) {
        let sum = 0;
        let count = 0;
        for (let j = i; j < values.length; j += period) {
          if (j < values.length) {
            sum += values[j];
            count++;
          }
        }
        seasons.push(count > 0 ? sum / count : 0);
      }
      
      // 季節性調整（合計が0になるように）
      const seasonMean = seasons.reduce((a, b) => a + b, 0) / seasons.length;
      for (let i = 0; i < seasons.length; i++) {
        seasons[i] -= seasonMean;
      }
    }
    
    // 初期値の設定
    let level = values[0];
    let trend = values.length > 1 ? values[1] - values[0] : 0;
    
    // 予測実行
    const forecasts = [];
    
    // 既存データのフィッティング
    for (let i = 0; i < values.length; i++) {
      const season = seasons.length > 0 ? seasons[i % period] : 0;
      const predicted = level + trend + season;
      forecasts.push(predicted);
      
      const observedValue = values[i];
      level = alpha * (observedValue - season) + (1 - alpha) * (level + trend);
      trend = beta * (level - forecasts[i] + trend) + (1 - beta) * trend;
      
      if (seasons.length > 0) {
        seasons[i % period] = gamma * (observedValue - level - trend) + (1 - gamma) * seasons[i % period];
      }
    }
    
    // 将来の予測
    for (let i = 0; i < actualPeriods; i++) {
      const season = seasons.length > 0 ? seasons[(values.length + i) % period] : 0;
      const forecast = level + (i + 1) * trend + season;
      forecasts.push(forecast);
    }
    
    // 予測結果は、実データの長さ + 予測期間の長さ
    return forecasts.slice(forecasts.length - actualPeriods);
  } catch (error) {
    console.error('ETSモデル予測エラー:', error);
    // エラーが発生した場合は単純な線形予測を返す
    return linearForecast(values, actualPeriods);
  }
};

/**
 * Prophet風のアルゴリズムによる予測
 * Facebookが開発したProphetの簡易JS実装
 * @param {Object} data - 予測に使用する時系列データのオブジェクト（日付: 値）
 * @param {number} periods - 予測する期間数
 * @returns {Promise<Array>} - 予測結果の配列
 */
export const calculateProphet = (data, periods) => {
  // 予測期間を制限
  const actualPeriods = Math.min(periods, MAX_FORECAST_PERIOD);
  
  if (!data || Object.keys(data).length < 10) {
    const values = Object.values(data);
    return linearForecast(values, actualPeriods);
  }
  
  try {
    // 日付と値の配列を取得
    const dates = Object.keys(data).sort();
    const values = dates.map(date => data[date]);
    
    if (values.length < 2 * actualPeriods) {
      // データが少なすぎる場合は単純な線形予測を返す
      return linearForecast(values, actualPeriods);
    }
    
    // トレンド成分の分析（多項式回帰）
    const X = [];
    for (let i = 0; i < values.length; i++) {
      X.push([i, i*i]); // 線形項と二次項
    }
    
    const polynomial = new PolynomialRegression(values, 2);
    
    // 季節成分の抽出（フーリエ級数）
    const extractSeasonality = (values, period) => {
      if (values.length < 2 * period) return Array(values.length).fill(0);
      
      const seasons = [];
      for (let i = 0; i < values.length; i++) {
        seasons.push(values[i] - polynomial.predict(i));
      }
      
      // 移動平均による平滑化
      const smoothed = [];
      const windowSize = Math.floor(period / 4);
      
      for (let i = 0; i < seasons.length; i++) {
        let sum = 0;
        let count = 0;
        for (let j = Math.max(0, i - windowSize); j <= Math.min(seasons.length - 1, i + windowSize); j++) {
          sum += seasons[j];
          count++;
        }
        smoothed.push(sum / count);
      }
      
      // 季節性パターンの抽出
      const pattern = Array(period).fill(0);
      for (let i = 0; i < smoothed.length; i++) {
        pattern[i % period] += smoothed[i];
      }
      
      // 平均化
      for (let i = 0; i < period; i++) {
        pattern[i] /= Math.ceil(smoothed.length / period);
      }
      
      // 合計を0にする正規化
      const mean = pattern.reduce((a, b) => a + b, 0) / pattern.length;
      for (let i = 0; i < pattern.length; i++) {
        pattern[i] -= mean;
      }
      
      // 各データポイントに季節性を適用
      const seasonality = [];
      for (let i = 0; i < values.length; i++) {
        seasonality.push(pattern[i % period]);
      }
      
      return seasonality;
    };
    
    // 月次と週次の季節性を計算
    const monthlySeasonality = extractSeasonality(values, 12);
    const weeklySeasonality = extractSeasonality(values, 7);
    
    // 将来の予測値を計算
    const forecasts = [];
    
    for (let i = 0; i < actualPeriods; i++) {
      const t = values.length + i;
      const trend = polynomial.predict(t);
      const monthlySeason = monthlySeasonality.length > 0 ? monthlySeasonality[t % 12] : 0;
      const weeklySeason = weeklySeasonality.length > 0 ? weeklySeasonality[t % 7] : 0;
      
      forecasts.push(trend + monthlySeason + weeklySeason);
    }
    
    return forecasts;
  } catch (error) {
    console.error('Prophetモデル代替予測エラー:', error);
    // エラーが発生した場合は単純な線形予測を返す
    const values = Object.values(data);
    return linearForecast(values, actualPeriods);
  }
};

/**
 * ランダムフォレスト回帰モデルによる予測
 * （XGBoost/LightGBMの代替として実装）
 * @param {Array} values - 予測に使用する時系列データの配列
 * @param {number} periods - 予測する期間数
 * @returns {Array} - 予測結果の配列
 */
export const calculateRandomForest = (values, periods) => {
  // 予測期間を制限
  const actualPeriods = Math.min(periods, MAX_FORECAST_PERIOD);
  
  if (!values || values.length < 10) {
    console.warn('データが不足しているため、ランダムフォレストモデルは使用できません');
    return linearForecast(values, actualPeriods);
  }
  
  try {
    console.log('ランダムフォレスト: 入力データ', values.length + '件');
    
    // データの前処理を改善
    // 1. 異常値の検出と処理（より洗練された方法）
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
    
    // 中央値ベースの外れ値検出（より堅牢）
    const sortedValues = [...values].sort((a, b) => a - b);
    const q1 = sortedValues[Math.floor(sortedValues.length * 0.25)];
    const q3 = sortedValues[Math.floor(sortedValues.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    // 外れ値を処理しつつ、トレンド情報を保持
    const cleanedValues = values.map((v, i) => {
      if (v < lowerBound) return Math.max(lowerBound, q1 - 0.5 * iqr);
      if (v > upperBound) return Math.min(upperBound, q3 + 0.5 * iqr);
      return v;
    });
    
    console.log('ランダムフォレスト: 前処理後データ', {
      元の平均: mean,
      標準偏差: stdDev,
      Q1: q1,
      Q3: q3,
      IQR: iqr,
      下限: lowerBound,
      上限: upperBound
    });
    
    // 基本的なラグ変数のリスト（後でモデル学習・予測の両方で使用するため、関数外で定義）
    // より多くのラグ変数を追加（短期、中期、長期のパターンを捉える）
    const defaultLags = [
      1, 2, 3, 4, 5, 6, 7,             // 週単位のパターン
      14, 21, 28,                      // 複数週のパターン
      30, 60, 90, 180, 365             // 月、四半期、半年、年単位のパターン
    ].filter(lag => lag < cleanedValues.length / 2);
    
    // グローバルに使用するdiffStd変数
    let globalDiffStd = 0;
    
    // 特徴量エンジニアリング：より高度な特徴量を作成
    const createFeatures = (data) => {
      const X = [];
      const y = [];
      
      // 最大ラグ値
      const maxLag = Math.max(...defaultLags);
      if (maxLag >= data.length) {
        console.warn(`最大ラグ値(${maxLag})がデータサイズ(${data.length})を超えています`);
        return { X: [], y: [], featureCount: 0 };
      }
      
      // 季節性検出
      const seasonalLags = detectSeasonality(data);
      if (seasonalLags.length > 0) {
        console.log('検出された季節性ラグ:', seasonalLags);
        defaultLags.push(...seasonalLags.filter(lag => !defaultLags.includes(lag) && lag < data.length / 2));
      }
      
      // 差分特徴量（トレンド除去）の使用
      const diffs = [];
      for (let i = 1; i < data.length; i++) {
        diffs.push(data[i] - data[i-1]);
      }
      
      // 差分の統計量
      const diffMean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
      const diffStd = Math.sqrt(diffs.reduce((a, b) => a + Math.pow(b - diffMean, 2), 0) / diffs.length);
      // グローバル変数に設定
      globalDiffStd = diffStd;
      
      // データセット作成
      for (let i = maxLag; i < data.length; i++) {
        const features = [];
        
        // 1. 基本的なラグ特徴量
        for (const lag of defaultLags) {
          if (i - lag >= 0) {
            features.push(data[i - lag]);
          } else {
            features.push(data[0]); // データが足りない場合は最初の値で埋める
          }
        }
        
        // 2. 移動平均特徴量（異なるウィンドウ）
        const windowSizes = [3, 5, 7, 14, 30, 60, 90].filter(w => w < i);
        for (const w of windowSizes) {
          const slice = data.slice(i - w, i);
          const maValue = slice.reduce((a, b) => a + b, 0) / slice.length;
          features.push(maValue);
          
          // 3. 指数移動平均
          if (w <= 14) { // 計算負荷削減のため短期のみ
            let ema = slice[0];
            const alpha = 2 / (w + 1);
            for (let j = 1; j < slice.length; j++) {
              ema = alpha * slice[j] + (1 - alpha) * ema;
            }
            features.push(ema);
          }
        }
        
        // 4. トレンド特徴量（短期、中期、長期）
        // 差分ベースのトレンド（より正確）
        const trendWindows = [3, 7, 14, 30, 60, 90].filter(w => w < i);
        for (const w of trendWindows) {
          const old = data[i - w];
          const current = data[i - 1];
          const trend = (current - old) / w;
          features.push(trend);
        }
        
        // 5. 変動性・パターン特徴量
        for (const w of [7, 14, 30].filter(w => w < i)) {
          const slice = data.slice(i - w, i);
          
          // 分散（変動性）
          const sliceMean = slice.reduce((a, b) => a + b, 0) / slice.length;
          const variance = slice.reduce((a, b) => a + Math.pow(b - sliceMean, 2), 0) / slice.length;
          features.push(variance);
          
          // 最大値、最小値（範囲）
          const min = Math.min(...slice);
          const max = Math.max(...slice);
          features.push(max - min);
          
          // 最近の値と過去の平均との比較
          features.push(data[i-1] / sliceMean - 1);
        }
        
        // 6. 加速度（2次の変化率）特徴量
        if (i >= 3) {
          const accel = (data[i-1] - data[i-2]) - (data[i-2] - data[i-3]);
          features.push(accel);
          
          // 加速度の正規化値
          if (diffStd > 0) {
            features.push(accel / diffStd);
          } else {
            features.push(0);
          }
        } else {
          features.push(0, 0);
        }
        
        // 7. 周期性特徴量
        // 週次パターン（曜日効果）
        if (defaultLags.includes(7)) {
          // 現在値と7日前の値の比率
          const weekRatio = i >= 7 ? data[i-1] / Math.max(0.1, data[i-7]) : 1;
          features.push(weekRatio);
        }
        
        // 月次パターン
        if (defaultLags.includes(30)) {
          // 現在値と30日前の値の比率
          const monthRatio = i >= 30 ? data[i-1] / Math.max(0.1, data[i-30]) : 1;
          features.push(monthRatio);
        }
        
        // 8. 統計的特徴量
        // z-score（全体の分布における現在位置）
        const zScore = (data[i-1] - mean) / (stdDev || 1);
        features.push(zScore);
        
        // データポイントとその特徴量を追加
        X.push(features);
        y.push(data[i]);
      }
      
      if (X.length === 0) {
        console.warn('特徴量を生成できませんでした');
        return { X: [], y: [], featureCount: 0 };
      }
      
      return { X, y, featureCount: X[0].length };
    };
    
    // 季節性検出関数（自己相関に基づく）
    function detectSeasonality(data) {
      const lags = [];
      const maxLag = Math.min(Math.floor(data.length / 2), 365); // 最大1年

      // 平均の計算
      const mean = data.reduce((a, b) => a + b, 0) / data.length;
      
      // 自己共分散を計算
      const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
      if (variance === 0) return []; // 分散がゼロなら周期性なし
      
      // 各ラグごとの自己相関係数を計算（より多くのラグをチェック）
      for (let lag = 2; lag <= maxLag; lag++) {
        let autocovariance = 0;
        let n = 0;
        
        for (let i = 0; i < data.length - lag; i++) {
          autocovariance += (data[i] - mean) * (data[i + lag] - mean);
          n++;
        }
        
        if (n > 0) {
          autocovariance /= n;
          const autocorrelation = autocovariance / variance;
          
          // 自己相関が強い（0.25以上）場合、有意な周期と見なす
          // しきい値を下げて、より多くの季節性を検出
          if (autocorrelation > 0.25) {
            lags.push(lag);
          }
        }
      }
      
      // 優先順位の高い周期: 7 (週次), 30 (月次), 90 (四半期), 180 (半年), 365 (年次)
      const priorityLags = [7, 30, 90, 180, 365].filter(lag => lag < maxLag);
      
      const result = [];
      
      // 優先順位の高い周期に近いラグがあれば、それを使用
      for (const priorityLag of priorityLags) {
        const found = lags.find(lag => Math.abs(lag - priorityLag) <= priorityLag * 0.1);
        if (found) result.push(found);
      }
      
      // 他にも強い周期性があれば追加（最大5つまで）
      if (result.length < 5) {
        // 自己相関が強い順にソート
        const strongestLags = lags
          .filter(lag => !result.includes(lag))
          .slice(0, 5 - result.length);
        
        result.push(...strongestLags);
      }
      
      return result;
    }
    
    // 特徴量と目的変数の作成
    const { X, y, featureCount } = createFeatures(cleanedValues);
    
    if (X.length === 0 || y.length === 0) {
      console.warn('特徴量生成に失敗しました。線形予測を使用します。');
      return linearForecast(values, actualPeriods);
    }
    
    console.log('ランダムフォレスト: 特徴量生成完了', {
      特徴量数: featureCount,
      データポイント数: X.length
    });
    
    // データの分割 (過学習チェック用)
    const splitIndex = Math.floor(X.length * 0.8);
    const X_train = X.slice(0, splitIndex);
    const y_train = y.slice(0, splitIndex);
    const X_test = X.slice(splitIndex);
    const y_test = y.slice(splitIndex);
    
    console.log(`訓練データ: ${X_train.length}件, テストデータ: ${X_test.length}件`);
    
    // モデルの訓練
    // より多くの木を使用
    const baseModels = Math.min(100, Math.max(50, Math.floor(X_train.length / 10)));
    // より深い木を許容
    const maxDepth = 8;
    // より小さなサンプルサイズを許容
    const minSamplesSplit = 3;
    const forest = new RandomForest(baseModels, maxDepth, minSamplesSplit, 0.8);
    forest.fit(X_train, y_train);
    
    // トレーニングセットでのスコア計算
    const yPredTrain = forest.predict(X_train);
    const trainRMSE = Math.sqrt(
      y_train.reduce((sum, y, i) => sum + Math.pow(y - yPredTrain[i], 2), 0) / y_train.length
    );
    
    // テストセットでのスコア計算
    const yPredTest = forest.predict(X_test);
    const testRMSE = Math.sqrt(
      y_test.reduce((sum, y, i) => sum + Math.pow(y - yPredTest[i], 2), 0) / y_test.length
    );
    
    // 決定係数（R^2）の計算
    const y_mean = y_test.reduce((a, b) => a + b, 0) / y_test.length;
    const totalSS = y_test.reduce((sum, y) => sum + Math.pow(y - y_mean, 2), 0);
    const residualSS = y_test.reduce((sum, y, i) => sum + Math.pow(y - yPredTest[i], 2), 0);
    const r2 = 1 - (residualSS / totalSS);
    
    console.log('ランダムフォレスト: モデル評価', {
      トレーニングRMSE: trainRMSE,
      テストRMSE: testRMSE,
      決定係数: r2,
      特徴量数: featureCount,
      モデル数: baseModels
    });
    
    // 最小値と最大値を取得して、予測値の範囲を制限
    const minValue = Math.min(...cleanedValues);
    const maxValue = Math.max(...cleanedValues);
    const valueRange = maxValue - minValue;
    
    // 将来予測の準備
    // 最近のデータを取得（ログ出力用）
    const recentData = cleanedValues.slice(-Math.max(...defaultLags));
    
    // 予測値を格納する配列
    const predictions = [];
    
    // 特徴量エンジニアリングに必要な状態を保持
    let predictionState = [...cleanedValues];
    
    // 予測値の安定性を向上させるためのテクニック
    // 指数移動平均フィルタ - 強度を下げる
    const smoothingAlpha = 0.7; // 平滑化係数（大きいほどオリジナルの値を重視）
    let lastSmoothedValue = cleanedValues[cleanedValues.length - 1];
    
    // 過去の値から変化率の統計を計算（より多くのデータポイントで）
    const dayChanges = [];
    for (let i = 1; i < cleanedValues.length; i++) {
      if (cleanedValues[i-1] !== 0) {
        const change = (cleanedValues[i] - cleanedValues[i-1]) / cleanedValues[i-1];
        if (isFinite(change)) dayChanges.push(change);
      }
    }
    
    // 変化率の統計
    dayChanges.sort((a, b) => a - b);
    const medianChange = dayChanges[Math.floor(dayChanges.length / 2)] || 0.05;
    // より大きな変化を許容
    const maxAllowedChange = Math.max(0.15, medianChange * 5);
    
    console.log('ランダムフォレスト: 変化率統計', { 
      中央値変化率: medianChange, 
      最大許容変化率: maxAllowedChange,
      変化率サンプル数: dayChanges.length
    });
    
    let lastRawPrediction = predictionState[predictionState.length - 1];
    
    for (let i = 0; i < actualPeriods; i++) {
      // 現在の状態から特徴量を作成
      const features = [];
      
      // 1. 基本的なラグ特徴量
      for (const lag of defaultLags.filter(lag => lag < predictionState.length)) {
        features.push(predictionState[predictionState.length - lag]);
      }
      
      // 2. 移動平均特徴量
      const windowSizes = [3, 5, 7, 14, 30, 60, 90].filter(w => w < predictionState.length);
      for (const w of windowSizes) {
        const slice = predictionState.slice(-w);
        const maValue = slice.reduce((a, b) => a + b, 0) / slice.length;
        features.push(maValue);
        
        // 3. 指数移動平均
        if (w <= 14) {
          let ema = slice[0];
          const alpha = 2 / (w + 1);
          for (let j = 1; j < slice.length; j++) {
            ema = alpha * slice[j] + (1 - alpha) * ema;
          }
          features.push(ema);
        }
      }
      
      // 4. トレンド特徴量
      const trendWindows = [3, 7, 14, 30, 60, 90].filter(w => w < predictionState.length);
      for (const w of trendWindows) {
        const old = predictionState[predictionState.length - w];
        const current = predictionState[predictionState.length - 1];
        const trend = (current - old) / w;
        features.push(trend);
      }
      
      // 5. 変動性・パターン特徴量
      for (const w of [7, 14, 30].filter(w => w < predictionState.length)) {
        const slice = predictionState.slice(-w);
        
        // 分散
        const sliceMean = slice.reduce((a, b) => a + b, 0) / slice.length;
        const variance = slice.reduce((a, b) => a + Math.pow(b - sliceMean, 2), 0) / slice.length;
        features.push(variance);
        
        // 最大値、最小値（範囲）
        const min = Math.min(...slice);
        const max = Math.max(...slice);
        features.push(max - min);
        
        // 最近の値と過去の平均との比較
        features.push(predictionState[predictionState.length-1] / sliceMean - 1);
      }
      
      // 6. 加速度特徴量
      if (predictionState.length >= 3) {
        const accel = (predictionState[predictionState.length-1] - predictionState[predictionState.length-2]) - 
                    (predictionState[predictionState.length-2] - predictionState[predictionState.length-3]);
        features.push(accel);
        
        // 加速度の正規化値
        if (globalDiffStd > 0) {
          features.push(accel / globalDiffStd);
        } else {
          features.push(0);
        }
      } else {
        features.push(0, 0);
      }
      
      // 7. 周期性特徴量
      // 週次パターン
      if (predictionState.length >= 7) {
        const weekRatio = predictionState[predictionState.length-1] / Math.max(0.1, predictionState[predictionState.length-7]);
        features.push(weekRatio);
      } else {
        features.push(1);
      }
      
      // 月次パターン
      if (predictionState.length >= 30) {
        const monthRatio = predictionState[predictionState.length-1] / Math.max(0.1, predictionState[predictionState.length-30]);
        features.push(monthRatio);
      } else {
        features.push(1);
      }
      
      // 8. 統計的特徴量
      const zScore = (predictionState[predictionState.length-1] - mean) / (stdDev || 1);
      features.push(zScore);
      
      // 特徴量をゼロパディング
      while (features.length < featureCount) {
        features.push(0);
      }
      
      // ランダムフォレストによる予測
      const rawPrediction = forest.predict([features])[0];
      
      // 予測値の安定化処理 - 緩和
      // 1. 移動平均フィルタ（適度な平滑化）
      const lastValue = predictionState[predictionState.length - 1];
      let smoothedValue = smoothingAlpha * rawPrediction + (1 - smoothingAlpha) * lastSmoothedValue;
      lastSmoothedValue = smoothedValue;
      
      // 2. トレンド調整（予測の方向性を維持）
      const recentTrend = lastRawPrediction < rawPrediction ? 1 : -1;
      lastRawPrediction = rawPrediction;
      
      // 3. 変化率の制限（極端な予測を抑制するが、より大きな変化を許容）
      const changeRatio = Math.abs((smoothedValue - lastValue) / lastValue);
      let finalValue = smoothedValue;
      
      if (changeRatio > maxAllowedChange && isFinite(changeRatio) && lastValue !== 0) {
        const direction = smoothedValue > lastValue ? 1 : -1;
        finalValue = lastValue * (1 + direction * maxAllowedChange);
      }
      
      // 4. データ範囲の考慮（極端な外れ値を防止）
      const clippedValue = Math.max(
        minValue * 0.9,
        Math.min(maxValue * 1.1, finalValue)
      );
      
      // 状態を更新
      predictionState.push(clippedValue);
      
      // 予測値を追加
      predictions.push(clippedValue);
    }
    
    console.log('ランダムフォレスト: 最終予測結果', {
      予測数: predictions.length,
      予測サンプル: predictions.slice(0, 5)
    });
    
    return predictions;
  } catch (error) {
    console.error('ランダムフォレストモデル予測エラー:', error);
    // エラーが発生した場合は単純な線形予測を返す
    return linearForecast(values, actualPeriods);
  }
};

/**
 * LSTM（長短期記憶）ニューラルネットワークによる予測
 * @param {Array} values - 予測に使用する時系列データの配列
 * @param {number} periods - 予測する期間数
 * @returns {Promise<Array>} - 予測結果の配列
 */
export const calculateLSTM = async (values, periods) => {
  // 予測期間を制限
  const actualPeriods = Math.min(periods, MAX_FORECAST_PERIOD);
  
  if (!values || values.length < 10) {
    console.warn('データが不足しているため、LSTMモデルは使用できません');
    return linearForecast(values, actualPeriods);
  }
  
  try {
    console.log('LSTM: 入力データ', values);
    
    // データの前処理
    // 標準化（平均0、標準偏差1）
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length) || 1;
    const normalizedData = values.map(v => (v - mean) / stdDev);
    
    console.log('LSTM: 正規化データ', { mean, stdDev, sample: normalizedData.slice(0, 5) });
    
    // 時系列データをLSTM用の形式に変換
    // 例：過去windowSize個のデータから次の値を予測
    const windowSize = Math.min(5, Math.floor(values.length / 3));
    const createDataset = (data, windowSize) => {
      const X = [];
      const y = [];
      for (let i = 0; i < data.length - windowSize; i++) {
        X.push(data.slice(i, i + windowSize));
        y.push(data[i + windowSize]);
      }
      return { X, y };
    };
    
    const dataset = createDataset(normalizedData, windowSize);
    
    console.log('LSTM: データセットサイズ', { 
      Xshape: [dataset.X.length, windowSize], 
      yshape: [dataset.y.length] 
    });
    
    if (dataset.X.length === 0 || dataset.y.length === 0) {
      console.warn('LSTM: 学習データが不足しています');
      return linearForecast(values, actualPeriods);
    }
    
    // TensorFlowによるLSTMモデルの構築
    const { X, y } = dataset;
    const xTensor = tf.tensor3d(X, [X.length, windowSize, 1]);
    const yTensor = tf.tensor2d(y, [y.length, 1]);
    
    // LSTMモデルの定義
    const model = tf.sequential();
    
    // より単純なモデル構造（過学習を防ぐため）
    model.add(tf.layers.lstm({
      units: 32,
      returnSequences: false,
      inputShape: [windowSize, 1]
    }));
    
    // ドロップアウトで過学習を防止
    model.add(tf.layers.dropout(0.2));
    
    // 出力層
    model.add(tf.layers.dense({ units: 1 }));
    
    // モデルのコンパイル
    const learningRate = 0.01;
    const optimizer = tf.train.adam(learningRate);
    
    model.compile({
      optimizer: optimizer,
      loss: 'meanSquaredError'
    });
    
    console.log('LSTM: モデル構築完了', model.summary());
    
    // モデルの学習
    const epochs = 50;
    const batchSize = Math.min(32, Math.floor(X.length / 4));
    
    await model.fit(xTensor, yTensor, {
      epochs: epochs,
      batchSize: batchSize,
      shuffle: true,
      verbose: 0
    });
    
    console.log('LSTM: モデル学習完了');
    
    // 将来の予測
    let lastWindow = normalizedData.slice(normalizedData.length - windowSize);
    const predictions = [];
    
    // 最小値と最大値を取得して、予測値の範囲を制限
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue;
    
    console.log('LSTM: データ範囲', { minValue, maxValue, valueRange });
    
    for (let i = 0; i < actualPeriods; i++) {
      // 次の値を予測
      const inputTensor = tf.tensor3d([lastWindow], [1, windowSize, 1]);
      const prediction = model.predict(inputTensor);
      const predictedValue = prediction.dataSync()[0];
      
      // 予測値をデータセットに追加
      lastWindow.shift();
      lastWindow.push(predictedValue);
      
      // 予測値を非正規化
      const denormalizedValue = predictedValue * stdDev + mean;
      
      // 予測値の急激な変化を抑制
      const lastValue = i === 0 ? values[values.length - 1] : predictions[i - 1];
      const maxChange = valueRange * 0.05; // 値域の5%を最大変化量とする
      
      let smoothedValue = lastValue;
      const change = denormalizedValue - lastValue;
      
      if (Math.abs(change) <= maxChange) {
        smoothedValue = denormalizedValue;
      } else {
        smoothedValue = lastValue + Math.sign(change) * maxChange;
      }
      
      // 極端な予測値を避けるためのクリッピング
      const clippedValue = Math.max(
        minValue - valueRange * 0.1,
        Math.min(maxValue + valueRange * 0.1, smoothedValue)
      );
      
      predictions.push(clippedValue);
    }
    
    // モデルとテンソルを破棄
    model.dispose();
    xTensor.dispose();
    yTensor.dispose();
    
    console.log('LSTM: 予測結果', predictions);
    
    return predictions;
  } catch (error) {
    console.error('LSTMモデル予測エラー:', error);
    // エラーが発生した場合は単純な線形予測を返す
    return linearForecast(values, actualPeriods);
  }
};

/**
 * アンサンブルモデル（複数のモデルの平均）を使用した予測
 * @param {Array} values - 予測に使用する時系列データの配列
 * @param {Object} data - 予測に使用する時系列データのオブジェクト（日付: 値）
 * @param {number} periods - 予測する期間数
 * @returns {Promise<Array>} - 予測結果の配列
 */
export const calculateEnsemble = async (values, data, periods) => {
  // 予測期間を制限
  const actualPeriods = Math.min(periods, MAX_FORECAST_PERIOD);
  
  try {
    // 各モデルの予測を実行
    const arimaPromise = calculateSARIMA(values, actualPeriods).catch(e => {
      console.error('SARIMAモデルエラー:', e);
      return linearForecast(values, actualPeriods);
    });
    
    const etsPromise = Promise.resolve(calculateETS(values, actualPeriods));
    const prophetPromise = Promise.resolve(calculateProphet(data, actualPeriods));
    const lstmPromise = calculateLSTM(values, actualPeriods).catch(e => {
      console.error('LSTMモデルエラー:', e);
      return linearForecast(values, actualPeriods);
    });
    const rfPromise = Promise.resolve(calculateRandomForest(values, actualPeriods));
    
    // すべての予測結果を待機
    const [arimaResults, etsResults, prophetResults, lstmResults, rfResults] = 
      await Promise.all([arimaPromise, etsPromise, prophetPromise, lstmPromise, rfPromise]);
    
    // 各モデルの予測結果を平均化
    const ensembleResults = [];
    for (let i = 0; i < actualPeriods; i++) {
      // 各モデルの予測値を取得（NaNや無効な値は除外）
      const predictions = [
        arimaResults[i],
        etsResults[i],
        prophetResults[i],
        lstmResults[i],
        rfResults[i]
      ].filter(val => !isNaN(val) && val !== undefined && val !== null);
      
      // 有効な予測値がある場合は平均を計算、ない場合は線形予測を使用
      if (predictions.length > 0) {
        ensembleResults.push(predictions.reduce((a, b) => a + b, 0) / predictions.length);
      } else {
        const linearPredictions = linearForecast(values, actualPeriods);
        ensembleResults.push(linearPredictions[i]);
      }
    }
    
    return ensembleResults;
  } catch (error) {
    console.error('アンサンブルモデル予測エラー:', error);
    // エラーが発生した場合は単純な線形予測を返す
    return linearForecast(values, actualPeriods);
  }
};

/**
 * 単純な線形予測（フォールバック用）
 * @param {Array} values - 予測に使用する時系列データの配列
 * @param {number} periods - 予測する期間数
 * @returns {Array} - 予測結果の配列
 */
const linearForecast = (values, periods) => {
  // 予測期間を制限
  const actualPeriods = Math.min(periods, MAX_FORECAST_PERIOD);
  
  if (!values || values.length < 2) {
    console.warn('データが不足しているため、予測できません');
    return Array(actualPeriods).fill(values ? values[values.length - 1] || 0 : 0);
  }
  
  // 直近のトレンドを計算
  const n = Math.min(values.length, 12); // 最大12ポイントを使用
  const recentValues = values.slice(values.length - n);
  
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += recentValues[i];
    sumXY += i * recentValues[i];
    sumX2 += i * i;
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // 最後の値
  const lastValue = values[values.length - 1];
  const trend = slope;
  
  // 線形予測を実行
  return Array.from({ length: actualPeriods }, (_, i) => lastValue + (i + 1) * trend);
};

export const simpleExponentialSmoothing = (data, alpha = 0.2) => {
  if (!data || data.length === 0) return [];

  const forecasts = [data[0]];
  let lastForecast = data[0];

  for (let i = 1; i < data.length; i++) {
    lastForecast = alpha * data[i] + (1 - alpha) * lastForecast;
    forecasts.push(lastForecast);
  }

  return forecasts;
};

export const doubleExponentialSmoothing = (data, alpha = 0.2, beta = 0.1) => {
  if (!data || data.length === 0) return [];

  let level = data[0];
  let trend = data[1] - data[0];
  const forecasts = [data[0]];

  for (let i = 1; i < data.length; i++) {
    const lastLevel = level;
    level = alpha * data[i] + (1 - alpha) * (level + trend);
    trend = beta * (level - lastLevel) + (1 - beta) * trend;
    forecasts.push(level + trend);
  }

  return forecasts;
};

// ブラウザで動作するシンプルなRandomForestクラスを実装
class RandomForest {
  constructor(nEstimators = 50, maxDepth = 6, minSamplesSplit = 5, sampleRatio = 0.8) {
    this.nEstimators = nEstimators;
    this.maxDepth = maxDepth;
    this.minSamplesSplit = minSamplesSplit;
    this.sampleRatio = sampleRatio;
    this.trees = [];
  }

  // ブートストラップサンプリング
  bootstrapSample(X, y) {
    const samples = [];
    const n = X.length;
    const numSamples = Math.floor(n * this.sampleRatio);
    
    for (let i = 0; i < numSamples; i++) {
      const idx = Math.floor(Math.random() * n);
      samples.push(idx);
    }
    
    const X_sample = samples.map(idx => X[idx]);
    const y_sample = samples.map(idx => y[idx]);
    
    return { X: X_sample, y: y_sample };
  }

  // 木の生成（再帰的に分割）
  buildTree(X, y, depth = 0) {
    const n = X.length;
    
    // 終了条件
    if (n < this.minSamplesSplit || depth >= this.maxDepth || this.allSameValue(y)) {
      return {
        value: this.calculateLeafValue(y),
        isLeaf: true
      };
    }
    
    // 特徴量と分割点をランダムに選択
    const numFeatures = X[0].length;
    const featuresToConsider = Math.max(1, Math.floor(Math.sqrt(numFeatures)));
    const features = this.getRandomFeatures(numFeatures, featuresToConsider);
    
    let bestFeature = -1;
    let bestThreshold = 0;
    let bestScore = -Infinity;
    
    // 最良の分割を探す
    for (const feature of features) {
      const values = X.map(x => x[feature]);
      const uniqueValues = [...new Set(values)].sort((a, b) => a - b);
      
      // 分割点の候補を生成
      for (let i = 0; i < uniqueValues.length - 1; i++) {
        const threshold = (uniqueValues[i] + uniqueValues[i + 1]) / 2;
        
        // 分割の評価
        const score = this.evaluateSplit(X, y, feature, threshold);
        
        if (score > bestScore) {
          bestScore = score;
          bestFeature = feature;
          bestThreshold = threshold;
        }
      }
    }
    
    // 分割できない場合は葉ノードとする
    if (bestFeature === -1) {
      return {
        value: this.calculateLeafValue(y),
        isLeaf: true
      };
    }
    
    // データを分割
    const { leftX, leftY, rightX, rightY } = this.splitData(X, y, bestFeature, bestThreshold);
    
    // 子ノードが空の場合は葉ノードとする
    if (leftX.length === 0 || rightX.length === 0) {
      return {
        value: this.calculateLeafValue(y),
        isLeaf: true
      };
    }
    
    // 子ノードを再帰的に構築
    const leftNode = this.buildTree(leftX, leftY, depth + 1);
    const rightNode = this.buildTree(rightX, rightY, depth + 1);
    
    return {
      feature: bestFeature,
      threshold: bestThreshold,
      left: leftNode,
      right: rightNode,
      isLeaf: false
    };
  }
  
  // ランダムな特徴量のインデックスを取得
  getRandomFeatures(numFeatures, numToConsider) {
    const features = Array.from({ length: numFeatures }, (_, i) => i);
    const result = [];
    
    for (let i = 0; i < numToConsider; i++) {
      if (features.length === 0) break;
      const idx = Math.floor(Math.random() * features.length);
      result.push(features[idx]);
      features.splice(idx, 1);
    }
    
    return result;
  }
  
  // すべての値が同じかチェック
  allSameValue(y) {
    if (y.length === 0) return true;
    const firstValue = y[0];
    return y.every(val => val === firstValue);
  }
  
  // 葉ノードの値を計算（平均）
  calculateLeafValue(y) {
    if (y.length === 0) return 0;
    return y.reduce((sum, val) => sum + val, 0) / y.length;
  }
  
  // 分割の評価（分散の減少で評価）
  evaluateSplit(X, y, feature, threshold) {
    const { leftY, rightY } = this.splitData(X, y, feature, threshold);
    
    if (leftY.length === 0 || rightY.length === 0) return -Infinity;
    
    const totalVariance = this.calculateVariance(y);
    const leftVariance = this.calculateVariance(leftY);
    const rightVariance = this.calculateVariance(rightY);
    
    const leftWeight = leftY.length / y.length;
    const rightWeight = rightY.length / y.length;
    
    // 分散の減少量を計算
    return totalVariance - (leftWeight * leftVariance + rightWeight * rightVariance);
  }
  
  // データの分割
  splitData(X, y, feature, threshold) {
    const leftX = [];
    const leftY = [];
    const rightX = [];
    const rightY = [];
    
    for (let i = 0; i < X.length; i++) {
      if (X[i][feature] <= threshold) {
        leftX.push(X[i]);
        leftY.push(y[i]);
      } else {
        rightX.push(X[i]);
        rightY.push(y[i]);
      }
    }
    
    return { leftX, leftY, rightX, rightY };
  }
  
  // 分散の計算
  calculateVariance(y) {
    if (y.length === 0) return 0;
    const mean = y.reduce((sum, val) => sum + val, 0) / y.length;
    return y.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / y.length;
  }
  
  // 予測（単一の木）
  predictTree(tree, x) {
    if (tree.isLeaf) {
      return tree.value;
    }
    
    if (x[tree.feature] <= tree.threshold) {
      return this.predictTree(tree.left, x);
    } else {
      return this.predictTree(tree.right, x);
    }
  }
  
  // 学習
  fit(X, y) {
    this.trees = [];
    
    // 複数の決定木を構築
    for (let i = 0; i < this.nEstimators; i++) {
      // ブートストラップサンプリング
      const { X: X_sample, y: y_sample } = this.bootstrapSample(X, y);
      
      // 決定木の構築
      const tree = this.buildTree(X_sample, y_sample);
      this.trees.push(tree);
    }
  }
  
  // 予測（全ての木の平均）
  predict(X) {
    return X.map(x => {
      // 各木の予測値の平均を取る
      const predictions = this.trees.map(tree => this.predictTree(tree, x));
      return predictions.reduce((sum, val) => sum + val, 0) / predictions.length;
    });
  }
} 