from flask import Flask, request, jsonify
from flask_cors import CORS

from sanitation_agent import ask_agent

app = Flask(__name__)
CORS(app)


@app.route("/ask", methods=["POST"])
def ask():

    data = request.get_json()

    if not data or "question" not in data:
        return jsonify({
            "error": "Question is required"
        }), 400

    question = data["question"].strip()

    if not question:
        return jsonify({
            "error": "Question cannot be empty"
        }), 400

    try:
        answer = ask_agent(question)

        return jsonify({
            "question": question,
            "answer": answer
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


@app.route("/health", methods=["GET"])
def health():

    return jsonify({
        "status": "ok",
        "service": "Sanitation Co-Governance AI Agent"
    })


if __name__ == "__main__":

    print("=" * 50)
    print(" Sanitation AI Agent API")
    print("=" * 50)
    print("API running at: http://127.0.0.1:5000")
    print()

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )