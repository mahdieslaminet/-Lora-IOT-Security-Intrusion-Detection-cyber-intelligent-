"""Structured content for tutorial and related papers."""

from __future__ import annotations

from typing import Dict, List


def get_tutorial_content() -> Dict[str, object]:
    return {
        "title": "How This Project Works",
        "intro": (
            "This tutorial walks through the full reproduction workflow: dataset loading, "
            "paper-faithful preprocessing, nested CV with SMOTE and RFE, and model evaluation."
        ),
        "quickstart": {
            "notebook": [
                "python3 -m venv .venv",
                "source .venv/bin/activate",
                "pip install -r requirements.txt",
                "jupyter notebook",
            ],
            "backend": [
                "cd iot-anomaly-ui/backend",
                "PYTHONPATH=../.. python3 -m uvicorn main:app --reload",
            ],
            "frontend": [
                "cd iot-anomaly-ui/frontend",
                "npm install",
                "npm run dev",
            ],
            "docker": [
                "docker-compose up --build",
            ],
        },
        "pipeline": [
            "Load dataset from Hugging Face or upload local file.",
            "Map source columns to 14 canonical packet features.",
            "Preprocess: cyclical time encoding, binning, one-hot, flow aggregation.",
            "Balance classes with SMOTE inside nested stratified CV.",
            "Apply RFE with Decision Tree estimator.",
            "Tune models with ROC AUC in inner CV.",
            "Evaluate with Accuracy, Precision, Recall, F1 in outer CV.",
        ],
        "env": [
            {
                "name": "GEMINI_API_KEY",
                "description": "Optional Gemini assistant access key (backend only).",
            },
            {
                "name": "GAPGPT_BASE_URL",
                "description": "Optional base URL override for Gemini (default https://api.gapgpt.app/).",
            },
        ],
        "libraries": {
            "python": [
                {
                    "name": "scikit-learn",
                    "url": "https://pypi.org/project/scikit-learn/",
                    "description": "ML models, CV, and metrics.",
                },
                {
                    "name": "pandas",
                    "url": "https://pypi.org/project/pandas/",
                    "description": "Dataframes and preprocessing.",
                },
                {
                    "name": "numpy",
                    "url": "https://pypi.org/project/numpy/",
                    "description": "Numeric computing.",
                },
                {
                    "name": "datasets",
                    "url": "https://pypi.org/project/datasets/",
                    "description": "Hugging Face dataset loader.",
                },
                {
                    "name": "imbalanced-learn",
                    "url": "https://pypi.org/project/imbalanced-learn/",
                    "description": "SMOTE and imbalance handling.",
                },
                {
                    "name": "matplotlib",
                    "url": "https://pypi.org/project/matplotlib/",
                    "description": "Charts in the notebook.",
                },
                {
                    "name": "seaborn",
                    "url": "https://pypi.org/project/seaborn/",
                    "description": "Statistical plots.",
                },
                {
                    "name": "jupyter",
                    "url": "https://pypi.org/project/jupyter/",
                    "description": "Notebook runtime.",
                },
                {
                    "name": "pyyaml",
                    "url": "https://pypi.org/project/PyYAML/",
                    "description": "Config parsing.",
                },
                {
                    "name": "joblib",
                    "url": "https://pypi.org/project/joblib/",
                    "description": "Model serialization.",
                },
                {
                    "name": "fastapi",
                    "url": "https://pypi.org/project/fastapi/",
                    "description": "Backend API framework.",
                },
                {
                    "name": "uvicorn",
                    "url": "https://pypi.org/project/uvicorn/",
                    "description": "ASGI server.",
                },
                {
                    "name": "python-multipart",
                    "url": "https://pypi.org/project/python-multipart/",
                    "description": "File uploads.",
                },
                {
                    "name": "pydantic",
                    "url": "https://pypi.org/project/pydantic/",
                    "description": "Data validation.",
                },
                {
                    "name": "aiofiles",
                    "url": "https://pypi.org/project/aiofiles/",
                    "description": "Async file IO.",
                },
                {
                    "name": "pyarrow",
                    "url": "https://pypi.org/project/pyarrow/",
                    "description": "Parquet support.",
                },
                {
                    "name": "google-genai",
                    "url": "https://pypi.org/project/google-genai/",
                    "description": "Gemini assistant client.",
                },
            ],
            "frontend": [
                {
                    "name": "react",
                    "url": "https://www.npmjs.com/package/react",
                    "description": "UI framework.",
                },
                {
                    "name": "react-dom",
                    "url": "https://www.npmjs.com/package/react-dom",
                    "description": "DOM renderer.",
                },
                {
                    "name": "react-router-dom",
                    "url": "https://www.npmjs.com/package/react-router-dom",
                    "description": "Routing.",
                },
                {
                    "name": "vite",
                    "url": "https://www.npmjs.com/package/vite",
                    "description": "Dev server + build.",
                },
                {
                    "name": "typescript",
                    "url": "https://www.npmjs.com/package/typescript",
                    "description": "Static typing.",
                },
                {
                    "name": "@mui/material",
                    "url": "https://www.npmjs.com/package/@mui/material",
                    "description": "UI components.",
                },
                {
                    "name": "@mui/icons-material",
                    "url": "https://www.npmjs.com/package/@mui/icons-material",
                    "description": "MUI icons.",
                },
                {
                    "name": "@emotion/react",
                    "url": "https://www.npmjs.com/package/@emotion/react",
                    "description": "CSS-in-JS.",
                },
                {
                    "name": "@emotion/styled",
                    "url": "https://www.npmjs.com/package/@emotion/styled",
                    "description": "Styled components.",
                },
                {
                    "name": "recharts",
                    "url": "https://www.npmjs.com/package/recharts",
                    "description": "Charting.",
                },
                {
                    "name": "@fontsource-variable/space-grotesk",
                    "url": "https://www.npmjs.com/package/@fontsource-variable/space-grotesk",
                    "description": "Typography.",
                },
            ],
        },
        "troubleshooting": [
            "If datasets are large, reduce sample_size in the notebook or UI.",
            "If a dataset has only one class, the trainer will skip it.",
            "For slow training, reduce model count or grid size.",
        ],
    }


def get_related_papers() -> List[Dict[str, object]]:
    return [
        {
            "title": "Graph-based and scenario-driven microservice analysis, retrieval, and testing",
            "link": "https://doi.org/10.1016/j.future.2019.05.048",
            "summary": (
                "Focuses on graph-based modeling of microservices and scenario-driven retrieval for testing. "
                "We use it as inspiration for flow and scenario aggregation."
            ),
            "how_it_works": [
                "Build a call graph from distributed traces.",
                "Encode scenario sequences of service interactions.",
                "Retrieve similar scenarios for targeted testing.",
                "Run tests and track regressions.",
            ],
            "code": (
                "graph = build_service_graph(traces)\n"
                "scenarios = extract_scenarios(traces)\n"
                "vectors = embed_scenarios(scenarios)\n"
                "nearest = search_index(vectors, embed_scenario(query))\n"
                "for scenario in nearest:\n"
                "    run_test(generate_test(scenario))"
            ),
            "tags": ["graph", "microservices", "testing"],
        },
        {
            "title": "MQTTset, a New Dataset for Machine Learning Techniques on MQTT",
            "link": "https://doi.org/10.3390/s20226578",
            "summary": (
                "Introduces an MQTT-focused IoT dataset for ML detection and validates it with baseline models."
            ),
            "how_it_works": [
                "Collect MQTT traffic for benign and attack scenarios.",
                "Extract protocol-level and flow features.",
                "Train ML classifiers to validate the dataset.",
            ],
            "code": (
                "X, y = load_mqttset()\n"
                "X = add_flow_features(X)\n"
                "X = encode_time_cyclically(X)\n"
                "for model in [LogisticRegression(), RandomForest()]:\n"
                "    score = cross_validate(model, X, y, scoring='f1')"
            ),
            "tags": ["iot", "mqtt", "dataset"],
        },
        {
            "title": "Using Embedded Feature Selection and CNN for Classification on CCD-INID-V1",
            "link": "https://www.mdpi.com/1424-8220/21/14/4834",
            "summary": (
                "Presents an IoT intrusion dataset and combines embedded feature selection with a CNN classifier."
            ),
            "how_it_works": [
                "Build an IoT intrusion dataset (CCD-INID-V1).",
                "Select features with an embedded selector.",
                "Train a 1D CNN for classification.",
            ],
            "code": (
                "selector = SelectFromModel(RandomForestClassifier(n_estimators=200))\n"
                "X_sel = selector.fit_transform(X, y)\n"
                "model = build_1d_cnn(input_dim=X_sel.shape[1])\n"
                "model.fit(X_sel, y, epochs=20, batch_size=256)"
            ),
            "tags": ["iot", "cnn", "feature-selection"],
        },
        {
            "title": "Forewarned is Forearmed: A Survey on LLM-based Agents in Autonomous Cyberattacks",
            "link": "https://arxiv.org/html/2505.12786v2",
            "summary": (
                "Survey of LLM-based cyberattack agents and the defensive implications of autonomous tooling."
            ),
            "how_it_works": [
                "Catalog agent capabilities (browsing, code generation, planning).",
                "Map capabilities to attack phases and defensive controls.",
                "Provide mitigation recommendations and monitoring coverage.",
            ],
            "code": (
                "capabilities = ['web_browse', 'code_gen', 'tool_use']\n"
                "mitre = map_to_mitre(capabilities)\n"
                "controls = recommend_defenses(mitre)\n"
                "render_threat_matrix(mitre, controls)"
            ),
            "tags": ["llm", "survey", "defense"],
        },
        {
            "title": "MALCDF: A Distributed Multi-Agent LLM Framework for Real-Time Cyber",
            "link": "https://arxiv.org/abs/2512.14846v1",
            "summary": (
                "Multi-agent LLM framework for real-time cyber defense with detection, intelligence, response, and analysis agents."
            ),
            "how_it_works": [
                "Define specialized agents with explicit roles.",
                "Communicate over a secure message bus.",
                "Coordinate responses with audit-friendly outputs.",
            ],
            "code": (
                "agents = {\n"
                "  'detect': DetectionAgent(),\n"
                "  'intel': IntelligenceAgent(),\n"
                "  'respond': ResponseAgent(),\n"
                "  'analyze': AnalysisAgent(),\n"
                "}\n"
                "for alert in ids_predict(stream):\n"
                "  msg = secure_encode(alert)\n"
                "  agents['intel'].handle(msg)\n"
                "  agents['respond'].handle(msg)\n"
                "  agents['analyze'].handle(msg)"
            ),
            "tags": ["llm", "multi-agent", "real-time"],
        },
    ]

