import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider, ThemeConfig } from '@chakra-ui/react'
import { extendTheme } from '@chakra-ui/theme-utils'
import App from './App'

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
}

const theme = extendTheme({ config })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>,
)
