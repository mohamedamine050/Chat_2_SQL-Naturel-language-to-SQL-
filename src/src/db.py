import pymysql




from langsmith import traceable

def connect_to_db(db_name, db_password, db_user, db_host, db_port):
    try:
        connection = pymysql.connect(
            host=db_host,
            user=db_user,
            password=db_password,
            database=db_name,
            port=int(db_port),
            cursorclass=pymysql.cursors.DictCursor,
            connect_timeout=5
        )
        return connection
    except Exception as e:
        print(f"[DB Connection Error] {e}")
        return None

@traceable(name="Execute SQL Query")
def execute_sql(query):
    connection = pymysql.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASS,
        database=MYSQL_DB,
        cursorclass=pymysql.cursors.DictCursor,
    )
    try:
        with connection.cursor() as cursor:
            cursor.execute(query)
            
            # If the query returns rows (e.g. SELECT)
            if cursor.description:
                result = cursor.fetchall()
                
                # Check if it's a single row with a single column (like COUNT(*))
                if len(result) == 1 and len(result[0]) == 1:
                    # Return the value directly (the count number)
                    value = list(result[0].values())[0]
                    return {"status": "success", "data": value}
                
                # Otherwise return the full table result
                return {"status": "success", "data": result}
            
            else:
                # For queries like INSERT, UPDATE, DELETE
                return {"status": "success", "data": cursor.rowcount}
        
        connection.commit()
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        connection.close()




# utils/schema.py or inside your app file
def get_mysql_schema():
    connection = pymysql.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASS,
        database=MYSQL_DB,
        cursorclass=pymysql.cursors.DictCursor,
    )
    try:
        with connection.cursor() as cursor:
            cursor.execute(f"SHOW TABLES;")
            tables = [row[f'Tables_in_{MYSQL_DB}'] for row in cursor.fetchall()]
            schema = {"tables": []}

            for table in tables:
                cursor.execute(f"SHOW COLUMNS FROM {table};")
                columns = cursor.fetchall()

                table_info = {
                    "name": table,
                    "columns": [col["Field"] for col in columns],
                    "foreignKeys": []
                }

                # Detect foreign keys
                cursor.execute(f"""
                    SELECT COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
                    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                    WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s AND REFERENCED_TABLE_NAME IS NOT NULL;
                """, (MYSQL_DB, table))

                fks = cursor.fetchall()
                for fk in fks:
                    table_info["foreignKeys"].append({
                        "column": fk["COLUMN_NAME"],
                        "references": f"{fk['REFERENCED_TABLE_NAME']}.{fk['REFERENCED_COLUMN_NAME']}"
                    })

                schema["tables"].append(table_info)

            return schema
    finally:
        connection.close()
