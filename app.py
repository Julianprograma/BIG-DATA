from flask import Flask, request, jsonify
import subprocess
import os

app = Flask(__name__)

@app.route('/procesar_imagen', methods=['POST'])
def procesar_imagen():
    if 'image' not in request.files:
        return jsonify({'mensaje': 'No se envió imagen'}), 400
    imagen = request.files['image']
    ruta = os.path.join('uploads', imagen.filename)
    os.makedirs('uploads', exist_ok=True)
    imagen.save(ruta)
    # Ejecuta tu script externo y pásale la ruta de la imagen
    resultado = subprocess.run(['python', 'code_ORC.py', ruta], capture_output=True, text=True)
    return jsonify({'mensaje': resultado.stdout})

if __name__ == '__main__':
    app.run(debug=True)