import TimeSeries from 'timeseries-analysis';
import ARIMA from 'arima';

/**
 * SARIMA（季節性ARIMA）モデルを使用した予測
 * @param {Array} values - 予測に使用する時系列データの配列
 * @param {number} periods - 予測する期間数
 * @returns {Promise<Array>} - 予測結果の配列
 */
export const calculateSARIMA = async (values, periods) => {
  try {
    // ARIMAモデルのパラメータ
    // p: 自己回帰項の次数, d: 差分の次数, q: 移動平均項の次数
    // P, D, Q: 季節性成分のパラメータ, m: 季節性の周期
    const p = 1, d = 1, q = 1;
    const P = 1, D = 1, Q = 1, m = 12;

    // データが少ない場合は季節性なしのARIMAを使用
    if (values.length < 24) {
      const arima = new ARIMA({
        p: p,
        d: d,
        q: q,
        verbose: false
      });

      await arima.train(values);
      const [pred, errors] = arima.predict(periods);
      return pred;
    }

    // 季節性ARIMAモデルの作成と学習
    const arima = new ARIMA({
      p: p,
      d: d,
      q: q,
      P: P,
      D: D,
      Q: Q,
      s: m,
      verbose: false
    });

    await arima.train(values);
    const [pred, errors] = arima.predict(periods);
    return pred;
  } catch (error) {
    console.error('SARIMAモデル予測エラー:', error);
    // エラーが発生した場合は単純な線形予測を返す
    return linearForecast(values, periods);
  }
};

/**
 * ETS（指数平滑状態空間）モデルを使用した予測
 * @param {Array} values - 予測に使用する時系列データの配列
 * @param {number} periods - 予測する期間数
 * @returns {Array} - 予測結果の配列
 */
export const calculateETS = (values, periods) => {
  try {
    // TimeSeries-Analysisライブラリを使用
    const timeseries = new TimeSeries.main(
      values.map((value, index) => [index, value])
    );

    // データの長さに基づいて適切なETSモデルを選択
    let forecast;
    
    if (values.length >= 24) {
      // データが十分にある場合は季節性を考慮したETSモデル
      // 季節性の周期を設定（月次データの場合は12）
      const seasonalPeriod = 12;
      
      // 季節性指数平滑法を適用
      timeseries.smoother({
        period: seasonalPeriod,
        alpha: 0.3, // レベルの平滑化係数
        beta: 0.1,  // トレンドの平滑化係数
        gamma: 0.3, // 季節性の平滑化係数
        season: 'multiplicative' // 乗法的季節性
      });
      
      // 予測を実行
      forecast = [];
      for (let i = 0; i < periods; i++) {
        forecast.push(timeseries.forecast(i + 1));
      }
    } else {
      // データが少ない場合はホルト（二重指数平滑法）を使用
      timeseries.smoother({
        alpha: 0.3, // レベルの平滑化係数
        beta: 0.1   // トレンドの平滑化係数
      });
      
      // 予測を実行
      forecast = [];
      for (let i = 0; i < periods; i++) {
        forecast.push(timeseries.forecast(i + 1));
      }
    }
    
    return forecast;
  } catch (error) {
    console.error('ETSモデル予測エラー:', error);
    // エラーが発生した場合は単純な線形予測を返す
    return linearForecast(values, periods);
  }
};

/**
 * Prophetモデルの代替として、季節性を考慮したホルト・ウィンターズ法を使用
 * @param {Object} data - 予測に使用する時系列データのオブジェクト（日付: 値）
 * @param {number} periods - 予測する期間数
 * @returns {Promise<Array>} - 予測結果の配列
 */
export const calculateProphet = (data, periods) => {
  return new Promise((resolve) => {
    try {
      // データを配列に変換
      const values = Object.values(data).map(v => parseFloat(v));
      
      // データが少なすぎる場合は単純な線形予測を返す
      if (values.length < 12) {
        resolve(linearForecast(values, periods));
        return;
      }
      
      // 季節性を考慮したホルト・ウィンターズ法を使用
      const alpha = 0.2; // レベルの平滑化係数
      const beta = 0.1;  // トレンドの平滑化係数
      const gamma = 0.3; // 季節性の平滑化係数
      const seasonLength = 12; // 季節の長さ（月次データの場合は12）
      
      // 季節性の初期値を計算
      const seasonalIndices = [];
      for (let i = 0; i < seasonLength; i++) {
        let sum = 0;
        let count = 0;
        for (let j = i; j < values.length; j += seasonLength) {
          if (j < values.length) {
            sum += values[j];
            count++;
          }
        }
        seasonalIndices.push(count > 0 ? sum / count : 1);
      }
      
      // 季節性の平均を1に正規化
      const seasonalSum = seasonalIndices.reduce((a, b) => a + b, 0) / seasonLength;
      for (let i = 0; i < seasonLength; i++) {
        seasonalIndices[i] /= seasonalSum;
      }
      
      // 初期値の設定
      let level = values[0];
      let trend = (values[seasonLength] - values[0]) / seasonLength;
      
      // 実測値の期間のレベル、トレンド、季節性を計算
      for (let i = 0; i < values.length; i++) {
        const oldLevel = level;
        const seasonalIndex = i % seasonLength;
        
        level = alpha * (values[i] / seasonalIndices[seasonalIndex]) + (1 - alpha) * (level + trend);
        trend = beta * (level - oldLevel) + (1 - beta) * trend;
        seasonalIndices[seasonalIndex] = gamma * (values[i] / level) + (1 - gamma) * seasonalIndices[seasonalIndex];
      }
      
      // 将来の予測値を計算
      const forecasts = [];
      for (let i = 1; i <= periods; i++) {
        const forecastIndex = (values.length + i - 1) % seasonLength;
        forecasts.push((level + i * trend) * seasonalIndices[forecastIndex]);
      }
      
      resolve(forecasts);
    } catch (error) {
      console.error('Prophetモデル代替予測エラー:', error);
      // エラーが発生した場合は単純な線形予測を返す
      const values = Object.values(data).map(v => parseFloat(v));
      resolve(linearForecast(values, periods));
    }
  });
};

/**
 * アンサンブルモデル（複数のモデルの平均）を使用した予測
 * @param {Array} values - 予測に使用する時系列データの配列
 * @param {Object} data - 予測に使用する時系列データのオブジェクト（日付: 値）
 * @param {number} periods - 予測する期間数
 * @returns {Promise<Array>} - 予測結果の配列
 */
export const calculateEnsemble = async (values, data, periods) => {
  try {
    // 各モデルの予測を実行
    const sarimaPromise = calculateSARIMA(values, periods);
    const etsResults = calculateETS(values, periods);
    const prophetPromise = calculateProphet(data, periods);
    
    // すべての予測結果を待機
    const [sarimaResults, prophetResults] = await Promise.all([
      sarimaPromise,
      prophetPromise
    ]);
    
    // 各モデルの予測結果を平均化
    const ensembleResults = [];
    for (let i = 0; i < periods; i++) {
      // 各モデルの予測値を取得（NaNや無効な値は除外）
      const modelPredictions = [
        isFinite(sarimaResults[i]) ? sarimaResults[i] : null,
        isFinite(etsResults[i]) ? etsResults[i] : null,
        isFinite(prophetResults[i]) ? prophetResults[i] : null
      ].filter(val => val !== null);
      
      // 有効な予測値がある場合は平均を計算、ない場合は線形予測を使用
      if (modelPredictions.length > 0) {
        const average = modelPredictions.reduce((sum, val) => sum + val, 0) / modelPredictions.length;
        ensembleResults.push(average);
      } else {
        const linearResults = linearForecast(values, periods);
        ensembleResults.push(linearResults[i]);
      }
    }
    
    return ensembleResults;
  } catch (error) {
    console.error('アンサンブルモデル予測エラー:', error);
    // エラーが発生した場合は単純な線形予測を返す
    return linearForecast(values, periods);
  }
};

/**
 * 単純な線形予測（フォールバック用）
 * @param {Array} values - 予測に使用する時系列データの配列
 * @param {number} periods - 予測する期間数
 * @returns {Array} - 予測結果の配列
 */
const linearForecast = (values, periods) => {
  // データが少ない場合は最後の値を繰り返す
  if (values.length < 2) {
    return Array(periods).fill(values[values.length - 1] || 0);
  }
  
  // 直近のトレンドを計算
  const lastIndex = values.length - 1;
  const lastValue = values[lastIndex];
  const prevValue = values[lastIndex - 1];
  const trend = lastValue - prevValue;
  
  // 線形予測を実行
  return Array.from({ length: periods }, (_, i) => lastValue + (i + 1) * trend);
}; 