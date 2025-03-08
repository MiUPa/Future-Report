import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Papa from 'papaparse';
import DataInput from './components/DataInput';
import ForecastView from './components/ForecastView';
import HowToUse from './components/HowToUse';

// テーマの設定
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

function App({ basename }) {
  const [openResetDialog, setOpenResetDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  
  // データの状態
  const [categories, setCategories] = useState(() => {
    try {
      const savedCategories = localStorage.getItem('categories');
      return savedCategories ? JSON.parse(savedCategories) : [];
    } catch (error) {
      console.error('カテゴリーデータの読み込みエラー:', error);
      localStorage.removeItem('categories');
      return [];
    }
  });
  
  const [salesData, setSalesData] = useState(() => {
    try {
      const savedSalesData = localStorage.getItem('salesData');
      return savedSalesData ? JSON.parse(savedSalesData) : {};
    } catch (error) {
      console.error('売上データの読み込みエラー:', error);
      localStorage.removeItem('salesData');
      return {};
    }
  });

  // basenameの変更をログに出力（デバッグ用）
  useEffect(() => {
    console.log('Current basename:', basename);
  }, [basename]);

  // データが変更されたらlocalStorageに保存
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
      console.error('売上データの保存エラー:', error);
    }
  }, [salesData]);

  // サンプルデータを読み込む関数
  const loadSampleData = async () => {
    try {
      console.log('サンプルデータの読み込みを開始します...');
      
      // サンプルデータの作成（実際のCSVファイルの代わりに直接データを生成）
      const sampleCategories = ['製品A', '製品B', '製品C'];
      
      // 過去24ヶ月分のサンプルデータを生成
      const sampleSalesData = {};
      const today = new Date();
      
      // 各カテゴリに対してデータを生成
      sampleCategories.forEach(category => {
        sampleSalesData[category] = {};
        
        // ベースとなる売上数値（カテゴリごとに異なる）
        let baseValue = 100;
        if (category === '製品A') baseValue = 100;
        if (category === '製品B') baseValue = 200;
        if (category === '製品C') baseValue = 150;
        
        // 過去24ヶ月分のデータを生成
        for (let i = 0; i < 24; i++) {
          const date = new Date(today);
          date.setMonth(date.getMonth() - (24 - i));
          const dateKey = date.toISOString().split('T')[0];
          
          // 季節性（年間を通して波形）
          const seasonality = Math.sin((i % 12) / 12 * 2 * Math.PI) * 30;
          
          // トレンド（徐々に増加）
          const trend = i * 2;
          
          // ランダム成分
          const random = Math.floor(Math.random() * 30 - 15);
          
          // 最終的な値（負の値は0に補正）
          const value = Math.max(0, Math.floor(baseValue + seasonality + trend + random));
          sampleSalesData[category][dateKey] = value;
        }
      });
      
      console.log('生成されたサンプルデータ:', {
        カテゴリ: sampleCategories,
        データ例: Object.entries(sampleSalesData['製品A']).slice(0, 5)
      });
      
      // Stateを更新
      setCategories(sampleCategories);
      setSalesData(sampleSalesData);
      
      // 最初のカテゴリと「予測分析」タブを選択
      setActiveTab(1); // 予測タブに自動的に切り替え
      
      console.log('サンプルデータが正常に読み込まれました');
    } catch (error) {
      console.error('サンプルデータの読み込みエラー:', error);
    }
  };

  // 初期データがない場合、サンプルデータを読み込む
  useEffect(() => {
    if (categories.length === 0 && Object.keys(salesData).length === 0) {
      console.log('初期データがありません。サンプルデータを読み込みます...');
      loadSampleData();
    } else {
      console.log(`既存データを使用します: ${categories.length} カテゴリー, ${Object.keys(salesData).length} データセット`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // データをリセットする関数
  const handleResetData = () => {
    localStorage.removeItem('categories');
    localStorage.removeItem('salesData');
    setCategories([]);
    setSalesData({});
    setOpenResetDialog(false);
    
    // データリセット後、サンプルデータを自動的に読み込む
    setTimeout(() => {
      loadSampleData();
    }, 500);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Future-Report
            </Typography>
            <Box>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={loadSampleData}
                sx={{ mr: 2 }}
              >
                サンプルデータ読込
              </Button>
              <Button 
                variant="outlined" 
                color="secondary" 
                onClick={() => setOpenResetDialog(true)}
              >
                データをリセット
              </Button>
            </Box>
          </Box>
          
          <Tabs 
            value={activeTab} 
            onChange={(event, newValue) => setActiveTab(newValue)}
            aria-label="app tabs"
            sx={{ mb: 3 }}
          >
            <Tab label="データ管理" />
            <Tab label="予測分析" />
            <Tab label="使い方" />
          </Tabs>
          
          {activeTab === 0 && (
            <DataInput 
              categories={categories}
              setCategories={setCategories}
              salesData={salesData}
              setSalesData={setSalesData}
            />
          )}
          
          {activeTab === 1 && (
            <ForecastView 
              categories={categories}
              salesData={salesData}
            />
          )}
          
          {activeTab === 2 && (
            <HowToUse />
          )}
        </Box>
        
        {/* データリセット確認ダイアログ */}
        <Dialog
          open={openResetDialog}
          onClose={() => setOpenResetDialog(false)}
        >
          <DialogTitle>データをリセットしますか？</DialogTitle>
          <DialogContent>
            <DialogContentText>
              すべてのカテゴリーと売上データが削除されます。この操作は元に戻せません。
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenResetDialog(false)} color="primary">
              キャンセル
            </Button>
            <Button onClick={handleResetData} color="secondary">
              リセット
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </ThemeProvider>
  );
}

export default App; 