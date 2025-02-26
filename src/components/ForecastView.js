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
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function ForecastView({ categories, salesData }) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [chartData, setChartData] = useState(null);

  const calculateForecast = (data) => {
    if (!data || Object.keys(data).length === 0) return null;

    // データを日付でソート
    const sortedDates = Object.keys(data).sort();
    const values = sortedDates.map(date => data[date]);

    // 単純指数平滑法のパラメータ
    const alpha = 0.2;
    let forecast = values[0];
    const forecasts = [forecast];

    // 既存データの予測値を計算
    for (let i = 1; i < values.length; i++) {
      forecast = alpha * values[i] + (1 - alpha) * forecast;
      forecasts.push(forecast);
    }

    // 将来3ヶ月分の予測
    const futureMonths = 3;
    const lastValue = forecast;
    for (let i = 0; i < futureMonths; i++) {
      forecasts.push(lastValue);
    }

    // 将来の日付を生成
    const lastDate = new Date(sortedDates[sortedDates.length - 1]);
    const futureDates = Array.from({ length: futureMonths }, (_, i) => {
      const date = new Date(lastDate);
      date.setMonth(date.getMonth() + i + 1);
      return date.toISOString().split('T')[0];
    });

    return {
      labels: [...sortedDates, ...futureDates],
      datasets: [
        {
          label: '実績値',
          data: [...values, ...Array(futureMonths).fill(null)],
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        },
        {
          label: '予測値',
          data: forecasts,
          borderColor: 'rgb(255, 99, 132)',
          borderDash: [5, 5],
          tension: 0.1
        }
      ]
    };
  };

  useEffect(() => {
    if (selectedCategory && salesData[selectedCategory]) {
      const newChartData = calculateForecast(salesData[selectedCategory]);
      setChartData(newChartData);
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