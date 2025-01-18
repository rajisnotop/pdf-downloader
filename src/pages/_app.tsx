import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { Toaster } from 'react-hot-toast';
import type { AppProps } from 'next/app';

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  styles: {
    global: {
      body: {
        bg: 'gray.900',
        color: 'white',
      },
    },
  },
  colors: {
    gray: {
      50: '#f7fafc',
      100: '#edf2f7',
      200: '#e2e8f0',
      300: '#cbd5e0',
      400: '#a0aec0',
      500: '#718096',
      600: '#4a5568',
      700: '#2d3748',
      800: '#1a202c',
      900: '#171923',
    },
  },
  components: {
    Button: {
      baseStyle: {
        _focus: {
          boxShadow: 'outline',
        },
      },
      variants: {
        solid: {
          bg: 'blue.600',
          _hover: {
            bg: 'blue.500',
          },
          _active: {
            bg: 'blue.700',
          },
        },
      },
    },
    Input: {
      variants: {
        filled: {
          field: {
            bg: 'gray.700',
            _hover: {
              bg: 'gray.600',
            },
            _focus: {
              bg: 'gray.600',
            },
          },
        },
      },
    },
  },
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider theme={theme}>
      <Component {...pageProps} />
      <Toaster position="top-right" />
    </ChakraProvider>
  );
}
