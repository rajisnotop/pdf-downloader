import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  Input,
  Button,
  Heading,
  Text,
  useToast,
  Icon,
  InputGroup,
  InputLeftElement,
  Alert,
  AlertIcon,
  AlertDescription,
  Progress,
  FormControl,
  FormLabel,
  FormHelperText,
  UnorderedList,
  ListItem,
  HStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure
} from '@chakra-ui/react';
import { LinkIcon, DownloadIcon } from '@chakra-ui/icons';
import Head from 'next/head';
import { Squares } from "@/components/ui/squares-background"

export default function Home() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showManualViewer, setShowManualViewer] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({
    status: '',
    percentage: 0,
    details: ''
  });
  const [debugMode, setDebugMode] = useState(false);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const updateProgress = (status: string, percentage: number, details: string) => {
    setDownloadProgress({ status, percentage, details });
  };

  useEffect(() => {
    if (debugMode) {
      // Add debug styles
      const style = document.createElement('style');
      style.id = 'debug-styles';
      style.innerHTML = `
        .debug-highlight {
          outline: 2px solid red !important;
          position: relative !important;
        }
        .debug-tooltip {
          position: absolute !important;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 8px;
          border-radius: 4px;
          font-size: 12px;
          z-index: 9999;
          pointer-events: none;
          bottom: 100%;
          left: 0;
          margin-bottom: 5px;
        }
        .debug-copy-btn {
          position: absolute !important;
          top: 5px;
          right: 5px;
          background: #4CAF50;
          color: white;
          border: none;
          padding: 4px 8px;
          border-radius: 3px;
          cursor: pointer;
          font-size: 11px;
          transition: all 0.2s;
          z-index: 10000;
          opacity: 0;
          transform: translateY(-5px);
        }
        .debug-highlight .debug-copy-btn {
          opacity: 1;
          transform: translateY(0);
        }
        .debug-copy-btn:hover {
          background: #45a049;
        }
        @keyframes fadeOut {
          0% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; }
        }
        .debug-feedback {
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 14px;
        }
      `;
      document.head.appendChild(style);

      // Helper function to get element's path
      const getElementPath = (element) => {
        const path = [];
        let current = element;
        
        while (current && current !== document.body && current.parentNode) {
          let selector = current.tagName.toLowerCase();
          
          if (current.id) {
            selector += `#${current.id}`;
          } else {
            const classes = Array.from(current.classList)
              .filter(c => !c.startsWith('debug-'))
              .join('.');
            if (classes) {
              selector += `.${classes}`;
            }
            
            const sameTagSiblings = Array.from(current.parentNode.children)
              .filter(child => child.tagName === current.tagName);
            if (sameTagSiblings.length > 1) {
              const index = sameTagSiblings.indexOf(current) + 1;
              selector += `:nth-child(${index})`;
            }
          }
          
          path.unshift(selector);
          current = current.parentNode;
        }
        
        return path.join(' > ');
      };

      // Function to show feedback toast
      const showFeedback = (message) => {
        const feedback = document.createElement('div');
        feedback.className = 'debug-feedback';
        feedback.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 1rem 2rem;
          border-radius: 4px;
          z-index: 10000;
          animation: fadeOut 1.5s forwards;
        `;
        feedback.textContent = message;
        document.body.appendChild(feedback);

        setTimeout(() => {
          feedback.remove();
        }, 1500);
      };

      // Function to copy element info
      const copyElementInfo = async (target) => {
        const computedStyle = window.getComputedStyle(target);
        
        const elementInfo = {
          type: target.tagName.toLowerCase(),
          classes: Array.from(target.classList)
            .filter(c => !c.startsWith('debug-')),
          id: target.id || null,
          size: {
            width: target.offsetWidth,
            height: target.offsetHeight
          },
          styles: {
            position: computedStyle.position,
            display: computedStyle.display,
            margin: computedStyle.margin,
            padding: computedStyle.padding,
            width: computedStyle.width,
            height: computedStyle.height,
          },
          path: getElementPath(target)
        };

        try {
          const infoString = JSON.stringify(elementInfo, null, 2);
          await navigator.clipboard.writeText(infoString);
          showFeedback('Element info copied to clipboard!');
          console.log('Copied element info:', elementInfo);
        } catch (err) {
          console.error('Failed to copy:', err);
          showFeedback('Failed to copy element info');
        }
      };

      let currentTarget = null;

      // Mouse over handler
      const handleMouseOver = (e) => {
        const target = e.target;
        if (target.classList.contains('debug-highlight') || 
            target.classList.contains('debug-tooltip') || 
            target.classList.contains('debug-copy-btn')) return;

        currentTarget = target;

        // Remove previous highlights and buttons
        document.querySelectorAll('.debug-highlight').forEach(el => {
          el.classList.remove('debug-highlight');
          const oldBtn = el.querySelector('.debug-copy-btn');
          if (oldBtn) oldBtn.remove();
        });

        // Remove previous tooltip
        const oldTooltip = document.querySelector('.debug-tooltip');
        if (oldTooltip) oldTooltip.remove();

        // Add highlight
        target.classList.add('debug-highlight');

        // Create copy button
        const copyButton = document.createElement('button');
        copyButton.className = 'debug-copy-btn';
        copyButton.textContent = 'Copy Info';
        copyButton.onclick = (e) => {
          e.stopPropagation();
          copyElementInfo(target);
        };
        target.appendChild(copyButton);

        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'debug-tooltip';
        tooltip.innerHTML = `
          <div>Element: ${target.tagName.toLowerCase()}</div>
          <div>Class: ${target.className.replace('debug-highlight', '').trim()}</div>
          <div>Size: ${target.offsetWidth}x${target.offsetHeight}</div>
          ${target.id ? `<div>ID: ${target.id}</div>` : ''}
        `;
        target.appendChild(tooltip);
      };

      // Mouse out handler
      const handleMouseOut = (e) => {
        const target = e.target;
        const relatedTarget = e.relatedTarget;
        
        // Don't remove if moving to copy button
        if (relatedTarget && 
            (relatedTarget.classList.contains('debug-copy-btn') || 
             target.contains(relatedTarget))) {
          return;
        }
        
        target.classList.remove('debug-highlight');
        const copyBtn = target.querySelector('.debug-copy-btn');
        const tooltip = target.querySelector('.debug-tooltip');
        if (copyBtn) copyBtn.remove();
        if (tooltip) tooltip.remove();
      };

      // Add event listeners
      document.body.addEventListener('mouseover', handleMouseOver);
      document.body.addEventListener('mouseout', handleMouseOut);

      // Cleanup function
      return () => {
        document.body.removeEventListener('mouseover', handleMouseOver);
        document.body.removeEventListener('mouseout', handleMouseOut);
        const style = document.getElementById('debug-styles');
        if (style) style.remove();
      };
    }
  }, [debugMode]);

  const handleUrlChange = (e) => {
    const value = e.target.value;
    setUrl(value);
    if (value === '/debug') {
      setDebugMode(true);
      setUrl('');
    }
  };

  const handleDownloadClick = () => {
    if (!url) {
      setError('Please enter a PDF URL first');
      return;
    }
    onOpen();
  };

  const handleDownload = async (manual: boolean) => {
    try {
      setError('');
      setIsLoading(true);
      
      if (manual) {
        updateProgress('Preparing viewer', 20, 'Setting up protected PDF viewer...');
        setShowManualViewer(true);
        updateProgress('Ready', 100, 'PDF viewer is ready. Please scroll through all pages.');
      } else {
        updateProgress('Starting', 10, 'Initializing download process...');
        const response = await fetch('/api/proxy?url=' + encodeURIComponent(url));
        
        if (!response.ok) {
          throw new Error('Failed to download PDF');
        }

        updateProgress('Processing', 50, 'Downloading PDF content...');
        const blob = await response.blob();
        
        updateProgress('Finalizing', 90, 'Preparing file for download...');
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = 'downloaded.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        
        updateProgress('Complete', 100, 'Download completed successfully!');
        toast({
          title: 'Success',
          description: 'PDF downloaded successfully!',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err) {
      setError(err.message);
      updateProgress('Error', 0, 'Download failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      updateProgress('Starting', 10, 'Initializing protected PDF download...');
      
      const iframe = document.querySelector('iframe');
      if (!iframe) {
        throw new Error('Iframe not found');
      }

      updateProgress('Loading', 30, 'Loading jsPDF library...');
      // Load latest version of jsPDF with better quality support
      const loadJsPDF = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        
        script.onload = () => resolve(true);
        script.onerror = () => reject(new Error('Failed to load jsPDF library'));
        document.body.appendChild(script);
      });

      await loadJsPDF;

      try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: 'a4',
          compress: true
        });

        const images = iframe.contentDocument.getElementsByTagName('img');
        console.log('Found images:', images.length);

        let processedImages = 0;
        const totalImages = Array.from(images).filter(img => /^blob:/.test(img.src)).length;

        Array.from(images).forEach((img, index) => {
          if (!/^blob:/.test(img.src)) {
            return;
          }

          updateProgress('Converting', 
            50 + Math.round((processedImages / totalImages) * 40), 
            `Converting page ${processedImages + 1} of ${totalImages}...`
          );

          // Create high-resolution canvas
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Set canvas size to 2x for better quality
          canvas.width = img.width * 2;
          canvas.height = img.height * 2;
          
          // Enable image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Draw image at 2x size for better quality
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Get high quality JPEG
          const imgData = canvas.toDataURL('image/jpeg', 1.0);
          
          // Calculate page size based on image aspect ratio
          const imgAspect = canvas.width / canvas.height;
          
          if (processedImages > 0) {
            pdf.addPage();
          }

          // Get PDF page dimensions
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          const pageAspect = pageWidth / pageHeight;

          let imgWidth, imgHeight;
          if (imgAspect > pageAspect) {
            // Image is wider than page
            imgWidth = pageWidth;
            imgHeight = pageWidth / imgAspect;
          } else {
            // Image is taller than page
            imgHeight = pageHeight;
            imgWidth = pageHeight * imgAspect;
          }

          // Center image on page
          const x = (pageWidth - imgWidth) / 2;
          const y = (pageHeight - imgHeight) / 2;

          // Add image with high quality settings
          pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight, undefined, 'FAST');
          processedImages++;
        });

        updateProgress('Finalizing', 90, 'Generating final PDF...');
        // Save with better compression
        pdf.save('downloaded.pdf', { compress: true });
        updateProgress('Complete', 100, 'Protected PDF downloaded successfully!');
      } catch (error) {
        console.error('Error processing PDF:', error);
        setError('Failed to process PDF: ' + error.message);
      }
    } catch (error) {
      console.error('Manual download error:', error);
      setError('Failed to download PDF manually: ' + error.message);
      updateProgress('Error', 0, 'Download failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box minH="100vh" position="relative" overflow="hidden" bg="black">
      {/* Background Squares */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        width="100vw"
        height="100vh"
        zIndex={0}
        sx={{
          '& > canvas': {
            width: '100vw !important',
            height: '100vh !important',
          }
        }}
      >
        <Squares
          direction="diagonal"
          speed={0.5}
          squareSize={40}
          borderColor="rgba(255, 255, 255, 0.1)"
          hoverFillColor="rgba(255, 255, 255, 0.05)"
        />
      </Box>

      {/* Main Content */}
      <Box position="relative" zIndex={1} minH="100vh">
        <Container maxW="6xl" py={10}>
          <VStack spacing={8}>
            {/* Header */}
            <Box textAlign="center" w="full" py={4}>
              <Heading
                as="h1"
                fontSize={["3xl", "4xl"]}
                fontWeight="black"
                color="white"
                letterSpacing="tight"
                mb={2}
              >
                PDF Downloader Pro
              </Heading>
              <Text 
                color="gray.300" 
                fontSize="md"
                maxW="xl"
                mx="auto"
                lineHeight="tall"
              >
                Download and save view-only PDFs with ease. Works with Google Drive and other protected documents.
              </Text>
            </Box>

            {/* Main Card */}
            <Box
              w="full"
              bg="rgba(0, 0, 0, 0.8)"
              backdropFilter="blur(10px)"
              borderRadius="2xl"
              p={8}
              boxShadow="xl"
              border="1px"
              borderColor="gray.800"
            >
              <VStack spacing={6}>
                {/* URL Input */}
                <FormControl>
                  <FormLabel color="white">PDF URL</FormLabel>
                  <InputGroup size="lg">
                    <Input
                      value={url}
                      onChange={handleUrlChange}
                      placeholder="Paste your PDF URL here..."
                      bg="black"
                      border="1px"
                      borderColor="gray.800"
                      color="white"
                      _hover={{ borderColor: "white" }}
                      _focus={{ borderColor: "white", boxShadow: "0 0 0 1px white" }}
                    />
                  </InputGroup>
                  <FormHelperText color="gray.400">
                    Works with Google Drive and other protected PDFs
                  </FormHelperText>
                </FormControl>

                {/* Error Display */}
                {error && (
                  <Alert status="error" bg="black" color="white" borderRadius="lg" border="1px" borderColor="white">
                    <AlertIcon color="white" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Progress Information */}
                {isLoading && (
                  <Box w="full">
                    <Progress 
                      size="xs" 
                      value={downloadProgress.percentage} 
                      colorScheme="whiteAlpha" 
                      bg="gray.900"
                      borderRadius="full"
                      hasStripe
                      isAnimated
                    />
                    <HStack justify="space-between" mt={1}>
                      <Text color="gray.300" fontSize="sm">
                        {downloadProgress.status}
                      </Text>
                      <Text color="gray.300" fontSize="sm">
                        {downloadProgress.percentage}%
                      </Text>
                    </HStack>
                    <Text color="gray.400" fontSize="sm" mt={1}>
                      {downloadProgress.details}
                    </Text>
                  </Box>
                )}

                {/* Download Button */}
                <Button
                  leftIcon={<DownloadIcon />}
                  bg="white"
                  color="black"
                  size="lg"
                  width="full"
                  onClick={handleDownloadClick}
                  isLoading={isLoading}
                  loadingText={downloadProgress.status}
                  _hover={{ bg: "gray.100" }}
                  _active={{ bg: "gray.200" }}
                >
                  Download PDF
                </Button>
              </VStack>
            </Box>

            {/* Download Type Modal */}
            <Modal isOpen={isOpen} onClose={onClose} isCentered>
              <ModalOverlay backdropFilter="blur(10px)" bg="rgba(0, 0, 0, 0.8)" />
              <ModalContent bg="black" borderColor="white" borderWidth={1}>
                <ModalHeader color="white">Choose Download Type</ModalHeader>
                <ModalCloseButton color="white" />
                <ModalBody pb={6}>
                  <VStack spacing={4}>
                    <Button
                      leftIcon={<DownloadIcon />}
                      bg="white"
                      color="black"
                      size="lg"
                      width="full"
                      onClick={() => {
                        onClose();
                        handleDownload(false);
                      }}
                      _hover={{ bg: "gray.100" }}
                      _active={{ bg: "gray.200" }}
                    >
                      <VStack align="start" spacing={0}>
                        <Text>Normal PDF Download</Text>
                        <Text fontSize="xs" opacity={0.7}>
                          Best for standard PDFs with direct access
                        </Text>
                      </VStack>
                    </Button>

                    <Button
                      leftIcon={<DownloadIcon />}
                      variant="outline"
                      borderColor="white"
                      color="white"
                      size="lg"
                      width="full"
                      onClick={() => {
                        onClose();
                        handleDownload(true);
                      }}
                      _hover={{ bg: "whiteAlpha.100" }}
                      _active={{ bg: "whiteAlpha.200" }}
                    >
                      <VStack align="start" spacing={0}>
                        <Text>Protected PDF Download</Text>
                        <Text fontSize="xs" opacity={0.7}>
                          For Google Drive and other protected PDFs
                        </Text>
                      </VStack>
                    </Button>
                  </VStack>
                </ModalBody>
              </ModalContent>
            </Modal>

            {/* PDF Viewer */}
            {showManualViewer && (
              <Box
                w="full"
                bg="black"
                borderRadius="2xl"
                p={6}
                boxShadow="0 0 20px rgba(255, 255, 255, 0.1)"
                border="1px"
                borderColor="white"
              >
                <VStack spacing={6}>
                  {/* Instructions */}
                  <Box w="full">
                    <Heading size="md" color="white" mb={4}>
                      Instructions
                    </Heading>
                    <UnorderedList color="gray.300" spacing={2}>
                      <ListItem>Scroll through all pages to load them</ListItem>
                      <ListItem>Wait for the processing to complete</ListItem>
                      <ListItem>Click "Download" when ready</ListItem>
                    </UnorderedList>
                  </Box>

                  {/* PDF Frame */}
                  <Box
                    w="full"
                    h="600px"
                    border="1px"
                    borderColor="gray.800"
                    borderRadius="lg"
                    overflow="hidden"
                    position="relative"
                  >
                    <iframe
                      src={url}
                      style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        background: 'black',
                      }}
                    />
                  </Box>

                  {/* Download Button */}
                  <Button
                    leftIcon={<DownloadIcon />}
                    bg="white"
                    color="black"
                    size="lg"
                    width="full"
                    onClick={handleManualDownload}
                    isLoading={isLoading}
                    loadingText={downloadProgress.status}
                    _hover={{ bg: "gray.100" }}
                    _active={{ bg: "gray.200" }}
                  >
                    Download PDF
                  </Button>

                  {/* Progress Information */}
                  {isLoading && (
                    <Box w="full">
                      <Progress
                        size="xs"
                        value={downloadProgress.percentage}
                        colorScheme="whiteAlpha"
                        bg="gray.900"
                        borderRadius="full"
                        hasStripe
                        isAnimated
                      />
                      <HStack justify="space-between" mt={1}>
                        <Text color="gray.300" fontSize="sm">
                          {downloadProgress.status}
                        </Text>
                        <Text color="gray.300" fontSize="sm">
                          {downloadProgress.percentage}%
                        </Text>
                      </HStack>
                      <Text color="gray.400" fontSize="sm" mt={1}>
                        {downloadProgress.details}
                      </Text>
                    </Box>
                  )}

                  {/* Error Display */}
                  {error && (
                    <Alert status="error" bg="black" color="white" borderRadius="lg" border="1px" borderColor="white">
                      <AlertIcon color="white" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </VStack>
              </Box>
            )}

            {/* Footer */}
            <Box textAlign="center" color="gray.400" pt={8}>
              <Text>Made with ❤️ by PDF Downloader Team</Text>
              <Text fontSize="sm" mt={2} color="gray.500">
                For educational purposes only. Please respect copyright and terms of service.
              </Text>
            </Box>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
}
