const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');

const app = express();

// 日本語対応設定
app.use(cors({origin: true}));
app.use(express.json({charset: 'utf-8'}));

// データ保存用（本番ではFirestore使用）
let alertsData = [];
let healthData = {
  p2p: "ok",
  line: "ok", 
  last_update: 0
};

// ルートエンドポイント（稼働確認用）
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send('地震情報サーバー稼働中 - Firebase');
});

// 地震情報受信エンドポイント
app.post('/api/alerts', (req, res) => {
  try {
    const data = req.body;
    console.log('🚨 地震情報受信:', data.title);
    
    // タイムスタンプ追加
    data.timestamp = new Date().toISOString();
    alertsData.push(data);
    
    // 最新100件に制限
    if (alertsData.length > 100) {
      alertsData = alertsData.slice(-100);
    }
    
    res.json({
      status: "受信完了",
      message: "地震情報を正常に受信しました",
      timestamp: data.timestamp
    });
    
  } catch (error) {
    console.error('❌ エラー:', error);
    res.status(500).json({
      status: "エラー",
      message: "データ処理に失敗しました"
    });
  }
});

// ヘルスチェックエンドポイント
app.post('/api/health', (req, res) => {
  try {
    const data = req.body;
    if (data.health) {
      healthData = {
        ...healthData,
        ...data.health,
        last_update: Date.now()
      };
    }
    
    console.log('💓 ヘルスチェック:', healthData);
    res.json({
      status: "ok",
      health: healthData
    });
    
  } catch (error) {
    console.error('❌ ヘルスチェックエラー:', error);
    res.status(500).json({status: "エラー"});
  }
});

// アラートクリアエンドポイント
app.post('/api/clear', (req, res) => {
  try {
    console.log('🧹 アラートクリア');
    alertsData = [];
    res.json({
      status: "クリア完了",
      message: "アラートデータをクリアしました"
    });
    
  } catch (error) {
    console.error('❌ クリアエラー:', error);
    res.status(500).json({status: "エラー"});
  }
});

// データ取得エンドポイント（クライアント用）
app.get('/api/alerts', (req, res) => {
  res.json({
    alerts: alertsData,
    health: healthData,
    server_time: new Date().toISOString()
  });
});

// Firebase Functionsとしてエクスポート
exports.api = functions.https.onRequest(app);
