import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Snackbar,
  Alert
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import ja from 'date-fns/locale/ja';

function DataInput({ categories, salesData, setSalesData }) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState(null);

  const handleAddData = () => {
    try {
      if (selectedCategory && selectedDate && quantity) {
        const dateKey = selectedDate.toISOString().split('T')[0];
        const parsedQuantity = parseInt(quantity, 10);
        
        if (isNaN(parsedQuantity)) {
          setError('数量は有効な数値である必要があります');
          return;
        }
        
        setSalesData({
          ...salesData,
          [selectedCategory]: {
            ...(salesData[selectedCategory] || {}),
            [dateKey]: parsedQuantity
          }
        });
        setQuantity('');
        setError(null);
      }
    } catch (error) {
      console.error('データ追加エラー:', error);
      setError('データの追加中にエラーが発生しました');
    }
  };

  const handleCloseError = () => {
    setError(null);
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        販売データ入力
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
          
          <Grid item xs={12} sm={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
              <DatePicker
                label="日付"
                value={selectedDate}
                onChange={setSelectedDate}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <TextField
              label="数量"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              fullWidth
            />
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Button
              variant="contained"
              onClick={handleAddData}
              disabled={!selectedCategory || !selectedDate || !quantity}
              fullWidth
              sx={{ height: '100%' }}
            >
              データを追加
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseError}>
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default DataInput; 