const fs = require('fs')
const path = require('path')

// Route to serve the Swagger HTML file
const serveSwagger = (req, res) => {
  try {
    const swaggerFilePath = path.join(__dirname, './swagger.html')
    const swaggerContent = fs.readFileSync(swaggerFilePath, 'utf8')

    res.status(200).send(swaggerContent)
  } catch (error) {
    console.error('Erro ao servir o arquivo HTML:', error)
    res.status(500).send('Erro ao servir o arquivo HTML')
  }
}

// Route to serve the Swagger JavaScript file
const serveSwaggerJS = (req, res) => {
  try {
    const swaggerJSPath = path.join(__dirname, './swagger.js')
    const swaggerJSContent = fs.readFileSync(swaggerJSPath, 'utf8')

    // Set the MIME type as "application/javascript"
    res.set('Content-Type', 'application/javascript')
    res.status(200).send(swaggerJSContent)
  } catch (error) {
    console.error('Erro ao servir o arquivo JavaScript:', error)
    res.status(500).send('Erro ao servir o arquivo JavaScript')
  }
}

module.exports = {
  serveSwagger,
  serveSwaggerJS
}
