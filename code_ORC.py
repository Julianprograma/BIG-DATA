import cv2
import easyocr
from datetime import datetime
import os
import pyodbc
import re
import sys

# 1. Configurar EasyOCR
reader = easyocr.Reader(['es'], gpu=False)

# 2. Función para guardar en SQL Server
def guardar_en_sql(placa_detectada):
    try:
        conn = pyodbc.connect(
    'DRIVER={ODBC Driver 17 for SQL Server};'
    'SERVER=JULIANMORENO;'
    'DATABASE=BD_DATAWAREHOUSE;'
    'Trusted_Connection=yes;'
)
        cursor = conn.cursor()
        id_sensor = 4  # Sensor cámara activo
        timestamp = datetime.now()
        latitud = 4.6835
        longitud = -74.0482
        cursor.execute("""
            INSERT INTO Lectura (id_sensor, placa_detectada, timestamp, latitud, longitud)
            VALUES (?, ?, ?, ?, ?)
        """, id_sensor, placa_detectada, timestamp, latitud, longitud)
        conn.commit()
        cursor.close()
        conn.close()
        print(f"Placa {placa_detectada} guardada en la base de datos.")
    except Exception as e:
        print("Error al guardar en la base de datos:", e)
# ...existing code...

def procesar_imagen_ruta(ruta):
    if not os.path.exists(ruta):
        print("La imagen no existe.")
        return
    img = cv2.imread(ruta)
    if img is None:
        print("No se pudo cargar la imagen.")
        return
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    results = reader.readtext(gray)
    patron_placa = re.compile(r'^[A-Z]{3}[0-9]{3}$')  # AAA123
    for bbox, text, conf in results:
        plate_text = text.upper().replace(" ", "").replace("-", "")
        if patron_placa.match(plate_text):
            print(f"Placa identificada: {plate_text}")
            guardar_evidencia(img, plate_text)
            guardar_en_sql(plate_text)
        else:
            print(f"Texto detectado (descartado): {plate_text}")
    print("Procesamiento de imagen finalizado.")

# 6. Menú principal
def main():
    print("Selecciona una opción:")
    print("1. Escanear con cámara")
    print("2. Analizar imagen desde archivo")
    opcion = input("Opción (1/2): ").strip()
    if opcion == "1":
        procesar_camara()
    elif opcion == "2":
        procesar_imagen()
    else:
        print("Opción no válida.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        procesar_imagen_ruta(sys.argv[1])
    else:
        main()

# 3. Guardar evidencias
def guardar_evidencia(frame, plate):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    if not os.path.exists("alertas"):
        os.makedirs("alertas")
    cv2.imwrite(f"alertas/{plate}_{timestamp}.jpg", frame)

# 4. Procesar cámara en tiempo real
def procesar_camara():
    cap = cv2.VideoCapture(0)  # Usa la cámara del dispositivo
    if not cap.isOpened():
        print("No se pudo abrir la cámara.")
        return

    print("Presiona 'q' para salir.")
    frame_count = 0
    frame_rate = 10  # Procesa 1 frame cada 10 capturas (ajustable)

    patron_placa = re.compile(r'^[A-Z]{3}[0-9]{3}$')  # AAA123

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_count % frame_rate == 0:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            results = reader.readtext(gray)

            for bbox, text, conf in results:
                plate_text = text.upper().replace(" ", "").replace("-", "")
                # Solo placas con formato AAA123
                if patron_placa.match(plate_text):
                    print(f"Placa identificada: {plate_text}")
                    guardar_evidencia(frame, plate_text)
                    guardar_en_sql(plate_text)
                else:
                    print(f"Texto detectado (descartado): {plate_text}")

        frame_count += 1

        # Mostrar la cámara en tiempo real
        cv2.imshow("Camara - Escaneo de Placas", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            print("Escaneo detenido por el usuario.")
            break

    cap.release()
    cv2.destroyAllWindows()

# 5. Procesar imagen cargada
def procesar_imagen():
    ruta = input("Introduce la ruta de la imagen: ").strip()
    if not os.path.exists(ruta):
        print("La imagen no existe.")
        return
    img = cv2.imread(ruta)
    if img is None:
        print("No se pudo cargar la imagen.")
        return
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    results = reader.readtext(gray)
    patron_placa = re.compile(r'^[A-Z]{3}[0-9]{3}$')  # AAA123
    for bbox, text, conf in results:
        plate_text = text.upper().replace(" ", "").replace("-", "")
        if patron_placa.match(plate_text):
            print(f"Placa identificada: {plate_text}")
            guardar_evidencia(img, plate_text)
            guardar_en_sql(plate_text)
        else:
            print(f"Texto detectado (descartado): {plate_text}")
    print("Procesamiento de imagen finalizado.")

# 6. Menú principal
def main():
    print("Selecciona una opción:")
    print("1. Escanear con cámara")
    print("2. Analizar imagen desde archivo")
    opcion = input("Opción (1/2): ").strip()
    if opcion == "1":
        procesar_camara()
    elif opcion == "2":
        procesar_imagen()
    else:
        print("Opción no válida.")

if __name__ == "__main__":
    main()