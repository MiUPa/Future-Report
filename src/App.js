import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container, Box, Typography, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Tabs, Tab } from '@mui/material';
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
  // リセット確認ダイアログの状態
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  // タブの状態管理
  const [activeTab, setActiveTab] = useState(0);

  // localStorage から初期データを読み込む（エラーハンドリング追加）
  const [categories, setCategories] = useState(() => {
    try {
      const savedCategories = localStorage.getItem('categories');
      return savedCategories ? JSON.parse(savedCategories) : [];
    } catch (error) {
      console.error('カテゴリーデータの読み込みエラー:', error);
      localStorage.removeItem('categories'); // 破損データをクリア
      return [];
    }
  });
  
  const [salesData, setSalesData] = useState(() => {
    try {
      const savedSalesData = localStorage.getItem('salesData');
      return savedSalesData ? JSON.parse(savedSalesData) : {};
    } catch (error) {
      console.error('販売データの読み込みエラー:', error);
      localStorage.removeItem('salesData'); // 破損データをクリア
      return {};
    }
  });

  // データが変更されたら localStorage に保存（エラーハンドリング追加）
  useEffect(() => {
    try {
      localStorage.setItem('categories', JSON.stringify(categories));
    } catch (error) {
      console.error('カテゴリーデータの保存エラー:', error);
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem('salesData', JSON.stringify(salesData));
    } catch (error) {
      console.error('販売データの保存エラー:', error);
    }
  }, [salesData]);

  // データをリセットする関数
  const handleResetData = () => {
    try {
      localStorage.removeItem('categories');
      localStorage.removeItem('salesData');
      setCategories([]);
      setSalesData({});
      setResetDialogOpen(false);
    } catch (error) {
      console.error('データリセットエラー:', error);
    }
  };

  // タブ切り替え処理
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container>
        <Box sx={{ my: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <div>
              <Typography variant="h3" component="h1" gutterBottom>
                Future-Report
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                高度予測分析システム
              </Typography>
            </div>
            <Button 
              variant="outlined" 
              color="error" 
              onClick={() => setResetDialogOpen(true)}
            >
              データリセット
            </Button>
          </Box>
          
          {/* タブインターフェース */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="basic tabs example">
              <Tab label="データ管理" />
              <Tab label="予測分析" />
            </Tabs>
          </Box>
          
          {/* タブコンテンツ */}
          <Box role="tabpanel" hidden={activeTab !== 0}>
            {activeTab === 0 && (
              <DataInput 
                categories={categories} 
                salesData={salesData} 
                setSalesData={setSalesData} 
                setCategories={setCategories}
              />
            )}
          </Box>
          
          <Box role="tabpanel" hidden={activeTab !== 1}>
            {activeTab === 1 && (
              <ForecastView 
                categories={categories} 
                salesData={salesData} 
              />
            )}
          </Box>
        </Box>

        {/* リセット確認ダイアログ */}
        <Dialog
          open={resetDialogOpen}
          onClose={() => setResetDialogOpen(false)}
        >
          <DialogTitle>データリセットの確認</DialogTitle>
          <DialogContent>
            <DialogContentText>
              すべてのカテゴリーと販売データがリセットされます。この操作は元に戻せません。続行しますか？
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setResetDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleResetData} color="error" autoFocus>
              リセット
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </ThemeProvider>
  );
}

export default App; 