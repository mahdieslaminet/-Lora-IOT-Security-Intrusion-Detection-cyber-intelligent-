# Related Papers and Reproduction Sketches

This page summarizes related work and provides tutorial-style sketches. Summaries are based on public abstracts (Crossref/arXiv) when available.

## 1) Graph-based and scenario-driven microservice analysis, retrieval, and testing

- Link: https://doi.org/10.1016/j.future.2019.05.048
- Source: Crossref title only (abstract not available via Crossref).

What it is (limited):
- Focuses on analyzing and testing microservices using graph-based representations and scenario-driven retrieval.

Why it matters here:
- Graph-based dependency modeling is relevant for flow aggregation and incident correlation in security telemetry.

Reproduction sketch (high level):
- Build a microservice call graph from traces.
- Define scenarios as sequences of service interactions.
- Retrieve similar scenarios to identify test targets.
- Run automated tests and record regressions.

Code sketch (pseudocode):

```python
# 1) Build call graph
graph = build_service_graph(traces)

# 2) Encode scenarios
scenarios = extract_scenarios(traces, window="time")
scenario_vectors = embed_scenarios(scenarios)

# 3) Retrieve similar scenarios
query_vec = embed_scenario(query_scenario)
nearest = search_index(scenario_vectors, query_vec)

# 4) Generate tests for top scenarios
for scenario in nearest:
    test = generate_test_from_scenario(scenario)
    run_test(test)
```

## 2) MQTTset, a New Dataset for Machine Learning Techniques on MQTT

- Link: https://doi.org/10.3390/s20226578
- Title: MQTTset, a New Dataset for Machine Learning Techniques on MQTT
- Abstract (partial, from Crossref): IoT MQTT dataset for security research; includes creation and validation with a detection system.

What it is:
- A dataset built around MQTT traffic to enable ML-based detection for IoT networks.

How it works (from abstract):
- The dataset is collected from MQTT-based IoT traffic.
- A detection system validates the dataset by training ML models for attack detection.

Reproduction sketch:
- Collect MQTT traffic in benign and attack scenarios.
- Extract flow features (packet sizes, timing, flags, protocol fields).
- Train ML classifiers and validate detection performance.

Code sketch:

```python
# Load MQTTset
X, y = load_mqttset()

# Feature engineering
X = add_flow_features(X)
X = encode_time_cyclically(X)
X = one_hot_encode_protocols(X)

# Train baseline detectors
models = [LogisticRegression(), RandomForest(), AdaBoost()]
for model in models:
    scores = cross_validate(model, X, y, scoring="f1")
```

## 3) Using Embedded Feature Selection and CNN for Classification on CCD-INID-V1

- Link: https://www.mdpi.com/1424-8220/21/14/4834
- DOI: https://doi.org/10.3390/s21144834
- Title: Using Embedded Feature Selection and CNN for Classification on CCD-INID-V1 - A New IoT Dataset
- Abstract (partial, from Crossref): introduces an IoT intrusion dataset, uses embedded feature selection and CNN for classification.

What it is:
- An IoT dataset (CCD-INID-V1) and CNN-based IDS with embedded feature selection.

How it works (from abstract):
- Create an IoT intrusion dataset.
- Use embedded feature selection to reduce features.
- Train a CNN classifier for attack categories.

Reproduction sketch:
- Load CCD-INID-V1.
- Select features (embedded selection from tree-based or L1 models).
- Train a 1D CNN on tabular features.

Code sketch:

```python
# Feature selection
selector = SelectFromModel(RandomForestClassifier(n_estimators=200))
X_sel = selector.fit_transform(X, y)

# CNN classifier
model = build_1d_cnn(input_dim=X_sel.shape[1])
model.fit(X_sel, y, epochs=20, batch_size=256)
```

## 4) Forewarned is Forearmed: A Survey on LLM-based Agents in Autonomous Cyberattacks

- Link: https://arxiv.org/html/2505.12786v2
- Title: Forewarned is Forearmed: A Survey on Large Language Model-based Agents in Autonomous Cyberattacks
- Abstract (from arXiv): Survey of LLM-based agents used for autonomous cyberattacks and their capabilities, with defensive insights.

What it is:
- A survey mapping the capabilities of LLM-based attack agents and the resulting security impact.

How it works (from abstract):
- Categorizes agent capabilities (browsing, code generation, decision-making).
- Discusses threat inflation and defensive guidance.

Reproduction sketch:
- Build a taxonomy of agent capabilities.
- Map those capabilities to attack phases and defenses.
- Create a threat-matrix for monitoring and mitigation.

Code sketch:

```python
capabilities = ["web_browse", "code_gen", "tool_use", "decision_making"]
mitre_map = map_capabilities_to_mitre(capabilities)
controls = suggest_defenses(mitre_map)
render_threat_matrix(mitre_map, controls)
```

## 5) MALCDF: A Distributed Multi-Agent LLM Framework for Real-Time Cyber

- Link: https://arxiv.org/abs/2512.14846v1
- Title: MALCDF: A Distributed Multi-Agent LLM Framework for Real-Time Cyber
- Abstract (from arXiv): Multi-agent LLM defense framework with Detection, Intelligence, Response, Analysis agents and a secure communication layer. Evaluated on CICIDS2017 features.

What it is:
- A multi-agent LLM architecture for real-time cyber defense.

How it works (from abstract):
- Separate agents for detection, intelligence, response, and analysis.
- Secure, structured messaging and MITRE ATT&CK outputs.

Reproduction sketch:
- Build independent agents with clear input/output schemas.
- Define a secure message bus (signed/encrypted messages).
- Use a baseline IDS and share alerts to agents.

Code sketch:

```python
agents = {
    "detect": DetectionAgent(),
    "intel": IntelligenceAgent(),
    "respond": ResponseAgent(),
    "analyze": AnalysisAgent(),
}

alerts = ids_predict(stream)
for alert in alerts:
    msg = secure_encode(alert)
    agents["intel"].handle(msg)
    agents["respond"].handle(msg)
    agents["analyze"].handle(msg)
```

