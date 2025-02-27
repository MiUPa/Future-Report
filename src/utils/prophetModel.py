#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import json
import pandas as pd
from prophet import Prophet


def run_prophet_forecast(data_json, periods):
    """
    Prophetモデルを使用して時系列予測を行う

    Parameters:
    data_json (str): JSON形式の時系列データ。{"date": value, ...}の形式
    periods (int): 予測する期間数（月数）

    Returns:
    str: 予測結果のJSON文字列
    """
    try:
        # JSONデータをパース
        data = json.loads(data_json)

        # DataFrameに変換
        df = pd.DataFrame(
            [(date, float(value)) for date, value in data.items()],
            columns=['ds', 'y']
        )

        # 日付をDatetime型に変換
        df['ds'] = pd.to_datetime(df['ds'])

        # Prophetモデルの初期化と学習
        model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=False,
            daily_seasonality=False,
            seasonality_mode='multiplicative'
        )
        model.fit(df)

        # 将来の日付を生成
        future = model.make_future_dataframe(periods=periods, freq='M')

        # 予測を実行
        forecast = model.predict(future)

        # 予測結果を抽出
        result = forecast[['ds', 'yhat']].tail(periods)

        # 結果をJSON形式に変換
        predictions = result['yhat'].tolist()

        return json.dumps(predictions)

    except Exception as e:
        return json.dumps({"error": str(e)})


if __name__ == "__main__":
    # コマンドライン引数からデータと予測期間を取得
    data_json = sys.argv[1]
    periods = int(sys.argv[2])

    # 予測を実行して結果を出力
    result = run_prophet_forecast(data_json, periods)
    print(result)
