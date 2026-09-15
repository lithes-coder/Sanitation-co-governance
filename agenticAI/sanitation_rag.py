import os
from pathlib import Path

from dotenv import load_dotenv
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv()

# --------------------------------------------------
# 1. Load knowledge base
# --------------------------------------------------

BASE_DIR = Path(__file__).parent
KNOWLEDGE_FILE = BASE_DIR / "knowledge" / "sanitation_knowledge.txt"

text = KNOWLEDGE_FILE.read_text(encoding="utf-8")

document = Document(
    page_content=text,
    metadata={"source": "sanitation_knowledge.txt"}
)

# --------------------------------------------------
# 2. Split knowledge into smaller chunks
# --------------------------------------------------

splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=100
)

documents = splitter.split_documents([document])

print(f"Loaded {len(documents)} knowledge chunks.")

# --------------------------------------------------
# 3. Try to create embeddings + vectorstore (requires Ollama)
# --------------------------------------------------

retriever = None

try:
    from langchain_ollama import OllamaEmbeddings
    from langchain_community.vectorstores import FAISS

    embeddings = OllamaEmbeddings(model="nomic-embed-text")
    vectorstore = FAISS.from_documents(documents, embeddings)
    retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
    print("FAISS vectorstore ready (Ollama embeddings)")
except Exception as e:
    print(f"Warning: Ollama not available — using simple keyword retrieval ({e})")

# --------------------------------------------------
# 4. Fallback: simple keyword retriever (no Ollama needed)
# --------------------------------------------------

if retriever is None:
    class SimpleRetriever:
        """Pure keyword matching — zero dependencies."""

        def __init__(self, docs, k=3):
            self.docs = docs
            self.k = k

        def invoke(self, query: str):
            query_lower = query.lower()
            scored = []
            for doc in self.docs:
                content = doc.page_content.lower()
                # Count how many query words appear
                words = query_lower.split()
                score = sum(1 for w in words if w in content)
                scored.append((score, doc))
            scored.sort(key=lambda x: x[0], reverse=True)
            return [doc for _, doc in scored[:self.k]]

    retriever = SimpleRetriever(documents)
    print("Using simple keyword retriever (no Ollama)")


# --------------------------------------------------
# 5. Test retrieval
# --------------------------------------------------

if __name__ == "__main__":

    question = input("\nAsk the sanitation assistant: ")

    results = retriever.invoke(question)

    print("\n--- Retrieved Information ---\n")

    for i, result in enumerate(results, start=1):
        print(f"[Result {i}]")
        print(result.page_content)
        print()