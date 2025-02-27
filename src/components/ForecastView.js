import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid
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

  const calculateForecast = (data) => {
    if (!data || Object.keys(data).length === 0) return null;

    try {
      // データを日付でソート
      const sortedDates = Object.keys(data).sort();
      const values = sortedDates.map(date => data[date]);

      // データが少なすぎる場合は計算しない
      if (values.length === 0) return null;

      // 単純指数平滑法のパラメータ
      const alpha = 0.2;
      let forecast = values[0];
      
      // 実測値の期間の予測値を計算
      for (let i = 1; i < values.length; i++) {
        forecast = alpha * values[i] + (1 - alpha) * forecast;
      }
      
      // 将来3ヶ月分の予測
      const futureMonths = 3;
      
      // 将来の日付を生成
      const lastDate = new Date(sortedDates[sortedDates.length - 1]);
      const futureDates = Array.from({ length: futureMonths }, (_, i) => {
        const date = new Date(lastDate);
        date.setMonth(date.getMonth() + i + 1);
        return date.toISOString().split('T')[0];
      });

      // 実績値のデータセット（実際のデータがある期間のみ）
      const actualData = [...values, ...Array(futureMonths).fill(null)];
      
      // 予測値のデータセット
      // 最後の実測値の位置から予測値を表示
      const predictionData = Array(values.length).fill(null);
      
      // 最後の実測値と同じ値から予測線を開始
      predictionData[values.length - 1] = values[values.length - 1];
      
      // 将来の予測値
      const futurePredictions = Array(futureMonths).fill(forecast);
      
      // 日付を Date オブジェクトに変換
      const dateObjects = [...sortedDates, ...futureDates].map(dateStr => new Date(dateStr));
      
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
      return null;
    }
  };

  useEffect(() => {
    try {
      if (selectedCategory && salesData[selectedCategory]) {
        const newChartData = calculateForecast(salesData[selectedCategory]);
        setChartData(newChartData);
      } else {
        setChartData(null);
      }
    } catch (error) {
      console.error('チャートデータ設定エラー:', error);
      setChartData(null);
    }
  }, [selectedCategory, salesData]);

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        需要予測
      </Typography>
      <Paper elevation={2} sx={{ p: 2 }}>
        <Grid container spacing={2}>
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
        </Grid>

        {chartData && (
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
                    text: `${selectedCategory}の需要予測`
                  }
                }
              }}
            />
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default ForecastView; 