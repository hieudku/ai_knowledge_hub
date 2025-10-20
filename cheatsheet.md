# 🧠 AI Knowledge Hub – Command Cheat Sheet

A categorized quick-reference guide for managing, testing, and maintaining your AI Knowledge Hub environment, including Docker, Node.js scrapers, Ollama, and OpenWebUI.

---

## 🐳 1. Docker Setup & Management

### 🧩 Basic Container Operations
```bash
# List all running containers
docker ps

# Stop a container
docker stop openwebui

# Start a stopped container
docker start openwebui

# Restart container after config changes
docker restart openwebui

# View logs live
docker logs -f openwebui

# Enter a running container shell
docker exec -it openwebui bash

# Remove a container completely (if rebuilding from scratch)
docker rm -f openwebui

# Remove unused volumes and networks (optional cleanup)
docker system prune -a --volumes


### 🧩 Basic Container Operations
# Run OpenWebUI with Ollama & GPU support
docker run -d --name openwebui \
  -p 3000:8080 \
  -e OLLAMA_BASE_URL=http://host.docker.internal:11434 \
  -e DEFAULT_MODEL=mistral:7b-instruct \
  -v open-webui:/app/backend/data \
  --gpus all \
  --restart unless-stopped \
  ghcr.io/open-webui/open-webui:latest

# Stop and remove (if re-deploying)
docker stop openwebui && docker rm openwebui


### Docker Compose (Recommended Persistent Setup)
# Start containers in background
docker compose up -d

# Stop all services
docker compose down

# Rebuild and restart containers
docker compose up -d --build

# View logs from all services
docker compose logs -f



# List all downloaded models
ollama list

# Pull a new model
ollama pull gemma3:4b

# Run interactive chat with a model
ollama run gemma3:4b

# Delete an installed model
ollama rm gemma3:4b


# Connect from inside the container to local Ollama (Windows host)
curl http://host.docker.internal:11434/api/tags


### ⚙️ Running Scripts
# Run Hugging Face model scraper
node harvest_ai_models.js

# Run Reddit AI discussion scraper
node harvest_reddit_ai.js



### 📦 Node & Package Setup
# Initialize Node.js project
npm init -y

# Install dependencies
npm install axios dotenv openai

# Run Node scripts in PowerShell or CMD
node harvest_ai_models.js


### 🔐 4. Environment Management
GROQ_API_KEY=your_groq_api_key
FIRECRAWL_API_KEY=your_firecrawl_api_key
OLLAMA_API_BASE_URL=http://host.docker.internal:11434
DEFAULT_MODEL=gemma3:4b
ENABLE_MCP_SERVERS=true
NVIDIA_VISIBLE_DEVICES=all
NVIDIA_DRIVER_CAPABILITIES=compute,utility

### 💡 Copy Example Template
cp .env.example .env

### 🔍 Testing API Access Inside Container
docker exec -it openwebui bash
curl http://host.docker.internal:11434/api/tags


### 🧰 6. Debugging & Troubleshooting
# Show running containers
docker ps

# View health and ports
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"

# Check model connectivity
ollama list
curl http://host.docker.internal:11434/api/tags


### 🧹 Cleanup and Fixes
# Fix permission issues inside container
chmod -R 777 /app/backend/data

# Restart services to reload environment changes
docker restart openwebui

# Delete failed container and volumes (last resort)
docker rm -f openwebui
docker volume prune


### 🧩 7. MCP, Groq & Firecrawl Commands
# Check Firecrawl MCP endpoint
curl https://mcp.firecrawl.dev/<YOUR_FIRECRAWL_API_KEY>/v2/mcp


### 🚀 Groq API (Remote MCP)
# Test Groq connection
curl https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer $GROQ_API_KEY"


### 🧩 8. PowerShell (Windows Host Specific)
# View container info in table format
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"

# Attach to running container shell
docker exec -it openwebui bash

# Run Node scripts directly from host
node harvest_ai_models.js
node harvest_reddit_ai.js


### 📂 9. Optional: Data Mounting Commands
# Copy harvested data into OpenWebUI uploads
docker cp "outputs/RedditAI/reddit_OpenAI_2025-10-19.txt" openwebui:/app/backend/data/uploads/reddit_ai/

# If directory doesn’t exist:
docker exec -it openwebui mkdir -p /app/backend/data/uploads/reddit_ai

