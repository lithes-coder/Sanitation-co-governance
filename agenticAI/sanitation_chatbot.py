from pathlib import Path

from dotenv import load_dotenv
from langchain_ollama import OllamaEmbeddings, ChatOllama
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS

load_dotenv()

BASE_DIR = Path(__file__).parent
KNOWLEDGE_FILE = BASE_DIR / "knowledge" / "sanitation_knowledge.txt"
VECTORSTORE_DIR = BASE_DIR / "knowledge" / "vectorstore"


# --------------------------------------------------
# 1. Embedding model
# --------------------------------------------------

embeddings = OllamaEmbeddings(
    model="nomic-embed-text"
)


# --------------------------------------------------
# 2. Create or load vector database
# --------------------------------------------------

def get_vectorstore():

    # If vector database already exists, load it
    if VECTORSTORE_DIR.exists():
        print("Loading existing vector database...")
        
        return FAISS.load_local(
            str(VECTORSTORE_DIR),
            embeddings,
            allow_dangerous_deserialization=True
        )

    # Otherwise create it for the first time
    print("Creating vector database for the first time...")

    text = KNOWLEDGE_FILE.read_text(encoding="utf-8")

    document = Document(
        page_content=text,
        metadata={"source": "sanitation_knowledge.txt"}
    )

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=100
    )

    documents = splitter.split_documents([document])

    vectorstore = FAISS.from_documents(
        documents,
        embeddings
    )

    VECTORSTORE_DIR.mkdir(parents=True, exist_ok=True)

    vectorstore.save_local(
        str(VECTORSTORE_DIR)
    )

    print(f"Saved vector database with {len(documents)} chunks.")

    return vectorstore


vectorstore = get_vectorstore()

retriever = vectorstore.as_retriever(
    search_kwargs={"k": 3}
)


# --------------------------------------------------
# 3. Local LLM
# --------------------------------------------------

llm = ChatOllama(
    model="llama3.2:3b",
    temperature=0
)


# --------------------------------------------------
# 4. RAG prompt
# --------------------------------------------------

prompt = ChatPromptTemplate.from_template(
    """
You are the AI assistant for the Sanitation Co-Governance Platform.

Answer the user's question using ONLY the provided context.

If the context does not contain enough information to answer the question,
say:

"I don't have enough information in my knowledge base to answer that."

Do not invent platform features, policies, procedures, or facts.

Context:
{context}

User question:
{question}

Give a clear and concise answer.
"""
)


# --------------------------------------------------
# 5. Chatbot function
# --------------------------------------------------

def ask_chatbot(question: str) -> str:

    retrieved_docs = retriever.invoke(question)

    context = "\n\n".join(
        doc.page_content for doc in retrieved_docs
    )

    messages = prompt.format_messages(
        context=context,
        question=question
    )

    response = llm.invoke(messages)

    return response.content


# --------------------------------------------------
# 6. Test chatbot
# --------------------------------------------------

if __name__ == "__main__":

    print("==========================================")
    print(" Sanitation Co-Governance AI Assistant")
    print("==========================================")
    print("Type 'exit' to stop.\n")

    while True:

        question = input("You: ")

        if question.lower() == "exit":
            print("Assistant: Goodbye!")
            break

        answer = ask_chatbot(question)

        print(f"\nAssistant: {answer}\n")