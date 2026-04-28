# --------------------------------------------------
# Test Database Connection
# --------------------------------------------------


# ---------------------------------------------------
# Imports
# ---------------------------------------------------
from sqlalchemy import text
from app.database import engine

# Attempt to connect and run a simple query
try:
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("Connection successful:", result.scalar())

 # Handle connection failure        
except Exception as e:
    print("Connection failed:")
    print(e)