/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com
 */

import { createVuetify } from 'vuetify'
import { components, directives } from 'vuetify/dist/vuetify.js'
import '@mdi/font/css/materialdesignicons.css'
import '../styles/layers.css'
import 'vuetify/styles'

export default createVuetify({
  theme: {
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#9933CC',
          secondary: '#CC3399',
          success: '#CCFF66',
          info: '#FFFF66',
          warning: '#000001',
          error: '#E61215',
          background: '#FFFFFA',
        },
      },
    },
    defaultTheme: 'light',
  },
  display: {
    mobileBreakpoint: 'md',
    thresholds: {
      xs: 0,
      sm: 600,
      md: 840,
      lg: 1145,
      xl: 1545,
      xxl: 2138,
    },
  },
  components,
  directives,
})
