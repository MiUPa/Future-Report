import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container, Box, Typography } from '@mui/material';
import CategoryManager from './components/CategoryManager';
import DataInput from './components/DataInput';
import ForecastView from './components/ForecastView';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [categories, setCategories] = useState([]);
  const [salesData, setSalesData] = useState({});

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container>
        <Box sx={{ my: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            NeedsCatcher
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            中長期需要予測システム
          </Typography>
          
          <CategoryManager 
            categories={categories} 
            setCategories={setCategories} 
          />
          
          <DataInput 
            categories={categories} 
            salesData={salesData} 
            setSalesData={setSalesData} 
          />
          
          <ForecastView 
            categories={categories} 
            salesData={salesData} 
          />
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App; 