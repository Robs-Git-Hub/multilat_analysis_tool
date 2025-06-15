# Directory structure

ngram_ternary_chart/
├── app.py
├── requirements.txt
├── data/
│   └── my_application_data.db  <-- Your SQLite DB file
└── src/
    ├── __init__.py
    ├── config.py               <-- Your config file (optional)
    ├── models/
    │   ├── __init__.py
    │   └── db_models.py        <-- Your SQLAlchemy models
    └── utils/
        ├── __init__.py
        └── ternary_data_utils.py