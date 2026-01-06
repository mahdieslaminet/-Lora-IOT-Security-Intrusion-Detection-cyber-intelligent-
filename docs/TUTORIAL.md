# Tutorial - How the Project Works

This page explains how to run the project end-to-end and links to the latest library downloads.

## 1) Quick Start (Notebook)

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
jupyter notebook
```

Open `notebooks/experiment_reproduction.ipynb` and run all cells.

## 2) Quick Start (Web UI)

Backend:

```bash
cd iot-anomaly-ui/backend
PYTHONPATH=../.. python3 -m uvicorn main:app --reload
```

Frontend:

```bash
cd iot-anomaly-ui/frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## 3) How the Pipeline Works

1) Load a dataset from Hugging Face or upload CSV/JSON/Parquet.
2) Map dataset columns to the 14 canonical packet features.
3) Preprocess: cyclical time encoding, binning, one-hot, flow aggregation.
4) Handle class imbalance with SMOTE inside nested stratified CV.
5) Feature selection with RFE using a Decision Tree estimator.
6) Train and tune 5 shallow ML models with ROC AUC in inner CV.
7) Evaluate with Accuracy, Precision, Recall, and F1 in outer CV.

## 4) Dependencies and Download Links

### Python (requirements.txt)

- scikit-learn: https://pypi.org/project/scikit-learn/
- pandas: https://pypi.org/project/pandas/
- numpy: https://pypi.org/project/numpy/
- datasets: https://pypi.org/project/datasets/
- imbalanced-learn: https://pypi.org/project/imbalanced-learn/
- matplotlib: https://pypi.org/project/matplotlib/
- seaborn: https://pypi.org/project/seaborn/
- jupyter: https://pypi.org/project/jupyter/
- pyyaml: https://pypi.org/project/PyYAML/
- joblib: https://pypi.org/project/joblib/
- fastapi: https://pypi.org/project/fastapi/
- uvicorn: https://pypi.org/project/uvicorn/
- python-multipart: https://pypi.org/project/python-multipart/
- pydantic: https://pypi.org/project/pydantic/
- aiofiles: https://pypi.org/project/aiofiles/
- pyarrow: https://pypi.org/project/pyarrow/
- google-genai: https://pypi.org/project/google-genai/

### Frontend (package.json)

- react: https://www.npmjs.com/package/react
- react-dom: https://www.npmjs.com/package/react-dom
- react-router-dom: https://www.npmjs.com/package/react-router-dom
- vite: https://www.npmjs.com/package/vite
- typescript: https://www.npmjs.com/package/typescript
- @mui/material: https://www.npmjs.com/package/@mui/material
- @mui/icons-material: https://www.npmjs.com/package/@mui/icons-material
- @emotion/react: https://www.npmjs.com/package/@emotion/react
- @emotion/styled: https://www.npmjs.com/package/@emotion/styled
- recharts: https://www.npmjs.com/package/recharts
- @fontsource-variable/space-grotesk: https://www.npmjs.com/package/@fontsource-variable/space-grotesk

## 5) Environment Variables

- GEMINI_API_KEY: enables the optional Gemini assistant
- GAPGPT_BASE_URL: optional override (default https://api.gapgpt.app/)

Example:

```bash
export GEMINI_API_KEY="your_key_here"
export GAPGPT_BASE_URL="https://api.gapgpt.app/"
```

## 6) Troubleshooting

- If datasets are large, lower sample_size in the notebook or UI.
- If a dataset has only one class, the training pipeline will skip it.
- For slow training, reduce the number of models or simplify grids.

