import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
  FormControlLabel,
  Radio,
  RadioGroup,
  CircularProgress
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Line } from 'react-chartjs-2';
import { ja } from 'date-fns/locale';
import { calculateSARIMA, calculateETS, calculateProphet, calculateEnsemble } from '../utils/forecastModels';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

function ForecastView({ categories, salesData }) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [chartData, setChartData] = useState(null);
  const [forecastPeriod, setForecastPeriod] = useState(3); // デフォルトは3ヶ月
  const [forecastMethod, setForecastMethod] = useState('holt-winters'); // デフォルトはHolt-Winters法
  const [isLoading, setIsLoading] = useState(false); // 予測計算中のローディング状態

  // 初期表示時に代表的なカテゴリを選択
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      // データ量が最も多いカテゴリを見つける
      let bestCategory = '';
      let maxDataPoints = 0;

      categories.forEach(category => {
        if (salesData[category]) {
          const dataPoints = Object.keys(salesData[category]).length;
          if (dataPoints > maxDataPoints) {
            maxDataPoints = dataPoints;
            bestCategory = category;
          }
        }
      });

      // データがあるカテゴリが見つからなければ、最初のカテゴリを選択
      if (!bestCategory && categories.length > 0) {
        bestCategory = categories[0];
      }

      if (bestCategory) {
        setSelectedCategory(bestCategory);
      }
    }
  }, [categories, salesData, selectedCategory]);

  const handleForecastPeriodChange = (event, newPeriod) => {
    if (newPeriod !== null) {
      setForecastPeriod(newPeriod);
    }
  };

  const handleForecastMethodChange = (event) => {
    setForecastMethod(event.target.value);
  };

  const calculateForecast = useCallback(async (data) => {
    if (!data || Object.keys(data).length === 0) return null;

    try {
      setIsLoading(true);
      
      // データを日付でソート
      const sortedDates = Object.keys(data).sort();
      const values = sortedDates.map(date => data[date]);

      // データが少なすぎる場合は計算しない
      if (values.length < 3) {
        setIsLoading(false);
        return null;
      }

      // 将来の予測値を計算
      let futurePredictions = [];
      
      // 選択された予測手法に基づいて予測を実行
      if (forecastMethod === 'ses') {
        // 単純指数平滑法（Simple Exponential Smoothing）
        futurePredictions = calculateSES(values, forecastPeriod);
      } else if (forecastMethod === 'holt') {
        // ホルト法（Holt's Linear Trend Method）
        futurePredictions = calculateHolt(values, forecastPeriod);
      } else if (forecastMethod === 'holt-winters') {
        // ホルト・ウィンターズ法（Holt-Winters Method）
        futurePredictions = calculateHoltWinters(values, forecastPeriod);
      } else if (forecastMethod === 'sarima') {
        // SARIMA（季節性ARIMA）モデル
        futurePredictions = await calculateSARIMA(values, forecastPeriod);
      } else if (forecastMethod === 'ets') {
        // ETS（指数平滑状態空間）モデル
        futurePredictions = calculateETS(values, forecastPeriod);
      } else if (forecastMethod === 'prophet') {
        // Prophetモデル
        futurePredictions = await calculateProphet(data, forecastPeriod);
      } else if (forecastMethod === 'ensemble') {
        // アンサンブルモデル（複数モデルの組み合わせ）
        futurePredictions = await calculateEnsemble(values, data, forecastPeriod);
      }
      
      // 将来の日付を生成
      const lastDate = new Date(sortedDates[sortedDates.length - 1]);
      const futureDates = Array.from({ length: forecastPeriod }, (_, i) => {
        const date = new Date(lastDate);
        date.setMonth(date.getMonth() + i + 1);
        return date.toISOString().split('T')[0];
      });

      // 実績値のデータセット（実際のデータがある期間のみ）
      const actualData = [...values, ...Array(forecastPeriod).fill(null)];
      
      // 予測値のデータセット
      // 最後の実測値の位置から予測値を表示
      const predictionData = Array(values.length).fill(null);
      
      // 最後の実測値と同じ値から予測線を開始
      predictionData[values.length - 1] = values[values.length - 1];
      
      // 日付を Date オブジェクトに変換
      const dateObjects = [...sortedDates, ...futureDates].map(dateStr => new Date(dateStr));
      
      setIsLoading(false);
      return {
        labels: dateObjects,
        datasets: [
          {
            label: '実績値',
            data: actualData.map((value, index) => ({
              x: dateObjects[index],
              y: value
            })).filter(point => point.y !== null),
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
          },
          {
            label: '予測値',
            data: [...predictionData, ...futurePredictions].map((value, index) => ({
              x: dateObjects[index],
              y: value
            })).filter(point => point.y !== null),
            borderColor: 'rgb(255, 99, 132)',
            borderDash: [5, 5],
            tension: 0.1
          }
        ]
      };
    } catch (error) {
      console.error('予測計算エラー:', error);
      setIsLoading(false);
      return null;
    }
  }, [forecastMethod, forecastPeriod]);

  // 単純指数平滑法（Simple Exponential Smoothing）
  const calculateSES = (values, periods) => {
    const alpha = 0.2; // 平滑化係数
    let forecast = values[0];
    
    // 実測値の期間の予測値を計算
    for (let i = 1; i < values.length; i++) {
      forecast = alpha * values[i] + (1 - alpha) * forecast;
    }
    
    // 将来の予測値（すべての期間で同じ値）
    return Array(periods).fill(forecast);
  };

  // ホルト法（Holt's Linear Trend Method）- トレンドを考慮
  const calculateHolt = (values, periods) => {
    const alpha = 0.2; // レベルの平滑化係数
    const beta = 0.1;  // トレンドの平滑化係数
    
    // 初期値の設定
    let level = values[0];
    let trend = values[1] - values[0];
    
    // 実測値の期間のレベルとトレンドを計算
    for (let i = 1; i < values.length; i++) {
      const oldLevel = level;
      level = alpha * values[i] + (1 - alpha) * (level + trend);
      trend = beta * (level - oldLevel) + (1 - beta) * trend;
    }
    
    // 将来の予測値を計算
    const forecasts = [];
    for (let i = 1; i <= periods; i++) {
      forecasts.push(level + i * trend);
    }
    
    return forecasts;
  };

  // ホルト・ウィンターズ法（Holt-Winters Method）- トレンドと季節性を考慮
  const calculateHoltWinters = (values, periods) => {
    // データが少なすぎる場合はホルト法を使用
    if (values.length < 12) {
      return calculateHolt(values, periods);
    }
    
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
    
    return forecasts;
  };

  useEffect(() => {
    try {
      if (selectedCategory && salesData[selectedCategory]) {
        calculateForecast(salesData[selectedCategory]).then(newChartData => {
          setChartData(newChartData);
        });
      } else {
        setChartData(null);
      }
    } catch (error) {
      console.error('チャートデータ設定エラー:', error);
      setChartData(null);
    }
  }, [selectedCategory, salesData, forecastPeriod, forecastMethod, calculateForecast]);

  // 予測モデルの説明テキスト
  const getModelDescription = () => {
    switch (forecastMethod) {
      case 'ses':
        return '単純指数平滑法は、過去の値を指数関数的に減衰させた加重平均を使用します。トレンドや季節性を考慮しません。';
      case 'holt':
        return 'ホルト法は、レベルとトレンドを考慮した予測を行います。季節性は考慮しません。';
      case 'holt-winters':
        return 'ホルト・ウィンターズ法は、レベル、トレンド、季節性を考慮した予測を行います。';
      case 'sarima':
        return 'SARIMA（季節性自己回帰和分移動平均）モデルは、時系列の自己相関構造と季節性を考慮した統計的モデルです。';
      case 'ets':
        return 'ETS（指数平滑状態空間）モデルは、誤差、トレンド、季節性の各要素を自動的に最適化します。';
      case 'prophet':
        return 'Prophet（Facebook開発）は、トレンド、季節性、休日効果を自動的に検出し、異常値に強いモデルです。';
      case 'ensemble':
        return 'アンサンブルモデルは、複数の予測モデル（SARIMA、ETS、Prophet）の結果を組み合わせて、より安定した予測を提供します。';
      default:
        return '';
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        予測分析
      </Typography>
      <Paper elevation={2} sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>カテゴリー</InputLabel>
              <Select
                value={selectedCategory}
                label="カテゴリー"
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ mr: 2 }}>
                予測期間:
              </Typography>
              <ToggleButtonGroup
                value={forecastPeriod}
                exclusive
                onChange={handleForecastPeriodChange}
                aria-label="forecast period"
                size="small"
              >
                <ToggleButton value={3} aria-label="3 months">
                  3ヶ月
                </ToggleButton>
                <ToggleButton value={6} aria-label="6 months">
                  6ヶ月
                </ToggleButton>
                <ToggleButton value={12} aria-label="1 year">
                  1年
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <FormControl component="fieldset">
              <Typography variant="body2" sx={{ mb: 1 }}>
                予測モデル:
              </Typography>
              <RadioGroup
                row
                aria-label="forecast method"
                name="forecast-method"
                value={forecastMethod}
                onChange={handleForecastMethodChange}
              >
                <FormControlLabel 
                  value="ses" 
                  control={<Radio size="small" />} 
                  label={<Typography variant="body2">単純指数平滑法</Typography>} 
                />
                <FormControlLabel 
                  value="holt" 
                  control={<Radio size="small" />} 
                  label={<Typography variant="body2">ホルト法</Typography>} 
                />
                <FormControlLabel 
                  value="holt-winters" 
                  control={<Radio size="small" />} 
                  label={<Typography variant="body2">ホルト・ウィンターズ法</Typography>} 
                />
                <FormControlLabel 
                  value="sarima" 
                  control={<Radio size="small" />} 
                  label={<Typography variant="body2">SARIMA</Typography>} 
                />
                <FormControlLabel 
                  value="ets" 
                  control={<Radio size="small" />} 
                  label={<Typography variant="body2">ETS</Typography>} 
                />
                <FormControlLabel 
                  value="prophet" 
                  control={<Radio size="small" />} 
                  label={<Typography variant="body2">Prophet</Typography>} 
                />
                <FormControlLabel 
                  value="ensemble" 
                  control={<Radio size="small" />} 
                  label={<Typography variant="body2">アンサンブル</Typography>} 
                />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              {getModelDescription()}
            </Typography>
          </Grid>
        </Grid>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          chartData && (
            <Box sx={{ mt: 2, height: 400 }}>
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      type: 'time',
                      time: {
                        unit: 'month',
                        displayFormats: {
                          month: 'yyyy-MM-dd'
                        },
                        tooltipFormat: 'yyyy-MM-dd'
                      },
                      adapters: {
                        date: {
                          locale: ja
                        }
                      },
                      ticks: {
                        autoSkip: false,
                        maxRotation: 45
                      }
                    },
                    y: {
                      beginAtZero: true
                    }
                  },
                  plugins: {
                    title: {
                      display: true,
                      text: `${selectedCategory}の予測分析（${forecastPeriod === 12 ? '1年' : forecastPeriod + 'ヶ月'}）`
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          const label = context.dataset.label || '';
                          const value = context.parsed.y;
                          return `${label}: ${Math.round(value)}`;
                        }
                      }
                    }
                  }
                }}
              />
            </Box>
          )
        )}
      </Paper>
    </Box>
  );
}

export default ForecastView; 