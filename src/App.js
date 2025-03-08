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
      console.log('Current basename:', basename);
      console.log('Current PUBLIC_URL:', process.env.PUBLIC_URL);
      
      // 絶対パスを使用してサンプルデータにアクセス
      const csvPath = '/Future-Report/sample/sample.csv';
      console.log(`サンプルデータのパス: ${csvPath}`);
      
      try {
        const response = await fetch(csvPath);
        console.log('レスポンスステータス:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        console.log(`CSVデータ取得成功: ${csvText.length} バイト`);
        
        if (csvText.length === 0) {
          throw new Error('CSVデータが空です');
        }
        
        // CSVの最初の数行をログに出力
        console.log('CSVデータの先頭部分:', csvText.substring(0, 100));
        
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            console.log(`CSVパース完了: ${results.data.length} 行のデータ`);
            console.log('最初の数行:', results.data.slice(0, 3));
            
            const newSalesData = {};
            const newCategories = [];
            
            // CSVデータを処理
            results.data.forEach((row, index) => {
              if (index < 5) {
                console.log('処理中の行:', row);
              }
              
              const category = row.category;
              // 日付フォーマットを変換（YYYY/M/D → YYYY-MM-DD）
              let date = '';
              if (row.date) {
                try {
                  const dateParts = row.date.split('/');
                  if (dateParts.length === 3) {
                    // 月と日が1桁の場合は0埋め
                    const year = dateParts[0];
                    const month = dateParts[1].padStart(2, '0');
                    const day = dateParts[2].padStart(2, '0');
                    date = `${year}-${month}-${day}`;
                  } else {
                    date = row.date; // フォーマットが異なる場合はそのまま使用
                  }
                } catch (e) {
                  console.error('日付変換エラー:', e, row.date);
                  date = row.date; // エラーの場合はそのまま使用
                }
              }
              
              // salesフィールドを使用
              const value = parseFloat(row.sales);
              
              if (!isNaN(value) && date && category) {
                if (!newCategories.includes(category)) {
                  newCategories.push(category);
                }
                
                if (!newSalesData[category]) {
                  newSalesData[category] = {};
                }
                
                newSalesData[category][date] = value;
              } else {
                if (index < 10) {
                  console.log('無効なデータ行:', row, '値の変換結果:', !isNaN(value), '日付あり:', !!date, 'カテゴリあり:', !!category);
                }
              }
            });
            
            console.log(`処理結果: ${newCategories.length} カテゴリー, データポイント数: ${Object.keys(newSalesData).reduce((sum, cat) => sum + Object.keys(newSalesData[cat]).length, 0)}`);
            console.log('カテゴリー:', newCategories);
            
            if (newCategories.length === 0) {
              console.error('有効なカテゴリーが見つかりませんでした');
              alert('サンプルデータの処理に失敗しました。有効なデータが見つかりません。');
              return;
            }
            
            setCategories(newCategories);
            setSalesData(newSalesData);
            console.log('サンプルデータを正常に読み込みました');
            
            // 予測タブに自動的に切り替え
            setActiveTab(1);
          },
          error: (error) => {
            console.error('CSVパースエラー:', error);
            alert('CSVデータの解析に失敗しました。');
          }
        });
      } catch (error) {
        console.error('サンプルデータの取得エラー:', error);
        
        // 代替手段として、ハードコードされたサンプルデータを使用
        console.log('ハードコードされたサンプルデータを使用します');
        
        const sampleCategory = 'サンプル';
        const newCategories = [sampleCategory];
        const newSalesData = {
          [sampleCategory]: {}
        };
        
        // 過去3ヶ月分のサンプルデータを生成
        const today = new Date();
        for (let i = 90; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD形式
          
          // 乱数で売上データを生成（10〜100の範囲）
          const sales = Math.floor(Math.random() * 90) + 10;
          newSalesData[sampleCategory][dateStr] = sales;
        }
        
        setCategories(newCategories);
        setSalesData(newSalesData);
        console.log('サンプルデータを生成しました');
        
        // 予測タブに自動的に切り替え
        setActiveTab(1);
      }
    } catch (error) {
      console.error('サンプルデータの読み込みエラー:', error);
      alert('サンプルデータの読み込み中にエラーが発生しました。');
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
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ mb: 3 }}
          >
            <Tab label="データ管理" />
            <Tab label="予測分析" />
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