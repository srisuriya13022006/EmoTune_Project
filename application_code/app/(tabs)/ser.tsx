import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, SafeAreaView,
  ScrollView, ActivityIndicator, Linking, Animated, Easing, Dimensions
} from 'react-native';
import { Audio } from 'expo-av';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons'; // Make sure to install @expo/vector-icons

export default function EnhancedVoiceEmotionScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictedEmotion, setPredictedEmotion] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Waveform animation values
  const [waveformBars] = useState(() => Array.from({ length: 8 }, () => new Animated.Value(0)));
  
  // Screen width for wave scaling
  const screenWidth = Dimensions.get('window').width;
  
  // Start pulse animation when recording
  useEffect(() => {
    let pulseAnimation: Animated.CompositeAnimation;
    
    if (isRecording) {
      pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
    } else {
      pulseAnim.setValue(1);
    }
    
    return () => {
      if (pulseAnimation) {
        pulseAnimation.stop();
      }
    };
  }, [isRecording, pulseAnim]);
  
  // Spinning animation for loading state
  useEffect(() => {
    let spinAnimation: Animated.CompositeAnimation;
    
    if (isPredicting) {
      spinAnimation = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();
    } else {
      spinAnim.setValue(0);
    }
    
    return () => {
      if (spinAnimation) {
        spinAnimation.stop();
      }
    };
  }, [isPredicting, spinAnim]);
  
  // Waveform animation when recording
  useEffect(() => {
    let waveformAnimations: Animated.CompositeAnimation[] = [];
    
    if (isRecording) {
      // Create animations for each bar with random heights and durations
      waveformAnimations = waveformBars.map((bar, index) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(bar, {
              toValue: Math.random() * 0.7 + 0.3, // Random height between 0.3 and 1
              duration: Math.random() * 400 + 600, // Random duration between 600ms and 1000ms
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(bar, {
              toValue: Math.random() * 0.5 + 0.1, // Random height between 0.1 and 0.6
              duration: Math.random() * 400 + 600, // Random duration between 600ms and 1000ms
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        );
      });
      
      // Start all animations
      waveformAnimations.forEach(animation => animation.start());
    } else {
      // Reset all bars when not recording
      waveformBars.forEach(bar => bar.setValue(0));
    }
    
    return () => {
      waveformAnimations.forEach(animation => animation.stop());
    };
  }, [isRecording, waveformBars]);
  
  // Fade in animation for results
  useEffect(() => {
    if (predictedEmotion) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [predictedEmotion, fadeAnim]);
  
  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  const startRecording = async () => {
    try {
      setPredictedEmotion(null);
      setRecommendations(null);
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        alert('Permission to access microphone is required!');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (err) {
      console.error('Recording error:', err);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      setIsPredicting(true);
      const recording = recordingRef.current;
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) return;

      const response = await fetch(uri);
      const blob = await response.blob();
      const audioFile = new File([blob], 'audio.wav', { type: 'audio/wav' });

      const formData = new FormData();
      formData.append('file', audioFile);

      const result = await axios.post('https://emotune-be.onrender.com/predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setPredictedEmotion(result.data.emotion);
      setRecommendations(result.data.recommendations);
    } catch (err) {
      console.error('Prediction error:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsPredicting(false);
    }
  };

  // Render waveform visualization
  const renderWaveform = () => {
    if (!isRecording) return null;
    
    return (
      <View style={styles.waveformContainer}>
        {waveformBars.map((bar, index) => (
          <Animated.View 
            key={index}
            style={[
              styles.waveformBar,
              {
                height: 50,
                transform: [
                  { scaleY: bar }
                ]
              }
            ]}
          />
        ))}
      </View>
    );
  };

  const renderEmotionIcon = (emotion: string) => {
    switch(emotion.toLowerCase()) {
      case 'happy':
      case 'joy':
        return <Ionicons name="happy" size={60} color="#FFD700" />;
      case 'sad':
        return <Ionicons name="sad" size={60} color="#4169E1" />;
      case 'angry':
        return <Ionicons name="flame" size={60} color="#FF4500" />;
      case 'fear':
        return <Ionicons name="warning" size={60} color="#8B0000" />;
      case 'disgust':
        return <Ionicons name="trash" size={60} color="#006400" />;
      case 'surprise':
        return <Ionicons name="star" size={60} color="#FF69B4" />;
      case 'neutral':
        return <Ionicons name="ellipsis-horizontal" size={60} color="#708090" />;
      default:
        return <Ionicons name="heart" size={60} color="#A855F7" />;
    }
  };

  const renderRecommendationList = (items: { title: string, link: string }[]) => (
    items.map((item, index) => (
      <TouchableOpacity
        key={index}
        style={styles.recommendationItem}
        onPress={() => Linking.openURL(item.link)}
      >
        <Text style={styles.recommendationLink}>{item.title}</Text>
        <Ionicons name="open-outline" size={18} color="#7E22CE" />
      </TouchableOpacity>
    ))
  );

  const getEmotionCardColor = (emotion: string | null) => {
    if (!emotion) return '#F8F8FF';
    
    switch(emotion.toLowerCase()) {
      case 'happy':
      case 'joy':
        return '#FFFACD';
      case 'sad':
        return '#E6E6FA';
      case 'angry':
        return '#FFE4E1';
      case 'fear':
        return '#F0F8FF';
      case 'disgust':
        return '#F0FFF0';
      case 'surprise':
        return '#FFF0F5';
      case 'neutral':
        return '#F5F5F5';
      default:
        return '#F8F8FF';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Voice Emotion Detector</Text>
          <Text style={styles.headerSubtitle}>Speak naturally to detect your emotional state</Text>
        </View>

        {/* Instructions Card */}
        <View style={styles.instructionCard}>
          <Ionicons name="information-circle" size={28} color="#9333EA" />
          <Text style={styles.instructionText}>
            Tap the button below to start recording your voice. Speak naturally for at least 5 seconds, then tap again to analyze your emotion.
          </Text>
        </View>

        {/* Recorder */}
        <View style={styles.recorderContainer}>
          <Animated.View style={[
            styles.pulseCircle,
            { transform: [{ scale: pulseAnim }] }
          ]}>
            <TouchableOpacity
              style={[styles.recordButton, isRecording && styles.recordingButton]}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={isPredicting}
            >
              {isRecording ? (
                <View style={styles.stopButtonInner} />
              ) : (
                <Ionicons name="mic" size={28} color={isPredicting ? "#C8C8C8" : "#9333EA"} />
              )}
            </TouchableOpacity>
          </Animated.View>
          
          {/* Audio waveform visualization */}
          {renderWaveform()}
          
          <Text style={styles.buttonLabel}>
            {isRecording ? 'Tap to Stop' : isPredicting ? 'Processing...' : 'Tap to Record'}
          </Text>
          {isRecording && (
            <Text style={styles.recordingIndicator}>Recording in progress...</Text>
          )}
        </View>

        {/* Emotion Result */}
        <View style={[
          styles.emotionContainer, 
          predictedEmotion && {backgroundColor: getEmotionCardColor(predictedEmotion)}
        ]}>
          <Text style={styles.sectionTitle}>Your Emotion</Text>
          {isPredicting ? (
            <View style={styles.loadingContainer}>
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Ionicons name="sync" size={40} color="#9333EA" />
              </Animated.View>
              <Text style={styles.loadingText}>Analyzing your voice...</Text>
            </View>
          ) : predictedEmotion ? (
            <Animated.View style={[
              styles.emotionResultContainer,
              { opacity: fadeAnim }
            ]}>
              {renderEmotionIcon(predictedEmotion)}
              <Text style={styles.emotionResult}>{predictedEmotion}</Text>
              <Text style={styles.emotionDescription}>
                {getEmotionDescription(predictedEmotion)}
              </Text>
            </Animated.View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="mic-outline" size={40} color="#A855F7" />
              <Text style={styles.placeholderText}>Record your voice to detect emotion</Text>
            </View>
          )}
        </View>

        {predictedEmotion && recommendations && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.recommendationsHeader}>
              <Text style={styles.recommendationsTitle}>Personalized Recommendations</Text>
              <Text style={styles.recommendationsSubtitle}>
                Based on your {predictedEmotion.toLowerCase()} emotional state
              </Text>
            </View>

            {/* Recommendations Tabs */}
            <View style={styles.recommendationTabs}>
              {/* Books */}
              <View style={styles.recommendationContainer}>
                <View style={styles.recommendationHeader}>
                  <Ionicons name="book" size={24} color="#9333EA" />
                  <Text style={styles.recommendationHeaderText}>Books</Text>
                </View>
                <View style={styles.recommendationContent}>
                  {recommendations?.books ? (
                    renderRecommendationList(recommendations.books)
                  ) : (
                    <Text style={styles.noRecommendationText}>No book recommendations available</Text>
                  )}
                </View>
              </View>

              {/* Music */}
              <View style={styles.recommendationContainer}>
                <View style={styles.recommendationHeader}>
                  <Ionicons name="musical-notes" size={24} color="#9333EA" />
                  <Text style={styles.recommendationHeaderText}>Music</Text>
                </View>
                <View style={styles.recommendationContent}>
                  {recommendations?.music ? (
                    renderRecommendationList(recommendations.music)
                  ) : (
                    <Text style={styles.noRecommendationText}>No music recommendations available</Text>
                  )}
                </View>
              </View>

              {/* Movies */}
              <View style={styles.recommendationContainer}>
                <View style={styles.recommendationHeader}>
                  <Ionicons name="film" size={24} color="#9333EA" />
                  <Text style={styles.recommendationHeaderText}>Movies</Text>
                </View>
                <View style={styles.recommendationContent}>
                  {recommendations?.movies ? (
                    renderRecommendationList(recommendations.movies)
                  ) : (
                    <Text style={styles.noRecommendationText}>No movie recommendations available</Text>
                  )}
                </View>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper function to get emotion descriptions
const getEmotionDescription = (emotion: string): string => {
  switch(emotion.toLowerCase()) {
    case 'happy':
    case 'joy':
      return 'You sound cheerful and optimistic. Your voice reflects contentment and positivity.';
    case 'sad':
      return 'Your voice indicates melancholy or sorrow. Taking time for self-care may help.';
    case 'angry':
      return 'Your voice shows signs of frustration or irritation. Try some deep breathing exercises.';
    case 'fear':
      return 'Your voice indicates anxiety or worry. Grounding techniques may help calm these feelings.';
    case 'disgust':
      return 'Your voice reflects aversion or disapproval. Try focusing on positive aspects.';
    case 'surprise':
      return 'Your voice shows astonishment or unexpected reaction to something.';
    case 'neutral':
      return 'Your voice sounds balanced and even-toned, without strong emotional markers.';
    default:
      return 'We detected this emotional state in your voice pattern.';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3E8FF',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 25,
    marginTop: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#7E22CE',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#9333EA',
    textAlign: 'center',
    marginTop: 5,
  },
  instructionCard: {
    flexDirection: 'row',
    backgroundColor: '#EDE9FE',
    borderRadius: 5,
    padding: 16,
    marginBottom: 25,
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#7E22CE',
    marginLeft: 12,
    lineHeight: 20,
  },
  recorderContainer: {
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 30,
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  pulseCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#A855F7',
    shadowColor: '#9333EA',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  recordingButton: {
    borderColor: '#FF0000',
    backgroundColor: '#FFEFEF',
  },
  stopButtonInner: {
    width: 22,
    height: 22,
    borderRadius: 3,
    backgroundColor: '#FF0000',
  },
  // Waveform styles
  waveformContainer: {
    flexDirection: 'row',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 5,
  },
  waveformBar: {
    width: 4,
    marginHorizontal: 4,
    backgroundColor: '#A855F7',
    borderRadius: 5,
  },
  buttonLabel: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: '600',
    color: '#7E22CE',
  },
  recordingIndicator: {
    marginTop: 8,
    fontSize: 14,
    color: '#FF0000',
    fontWeight: '500',
  },
  emotionContainer: {
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 24,
    marginBottom: 25,
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7E22CE',
    marginBottom: 15,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 15,
    color: '#A855F7',
    fontSize: 16,
    fontWeight: '500',
  },
  emotionResultContainer: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 5,
  },
  emotionResult: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#7E22CE',
    marginTop: 10,
    marginBottom: 5,
    textTransform: 'capitalize',
  },
  emotionDescription: {
    fontSize: 14,
    color: '#9333EA',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 5,
  },
  placeholderContainer: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#D8BFD8',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 16,
    color: '#A855F7',
    textAlign: 'center',
    marginTop: 15,
  },
  recommendationsHeader: {
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  recommendationsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#7E22CE',
  },
  recommendationsSubtitle: {
    fontSize: 14,
    color: '#9333EA',
    marginTop: 5,
  },
  recommendationTabs: {
    marginBottom: 10,
  },
  recommendationContainer: {
    backgroundColor: 'white',
    borderRadius: 5,
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginBottom: 20,
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  recommendationHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7E22CE',
    marginLeft: 10,
  },
  recommendationContent: {
    borderRadius: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F5F3FF',
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E9DAFF',
    elevation: 2,
  },
  recommendationLink: {
    flex: 1,
    fontSize: 15,
    color: '#7E22CE',
    marginRight: 10,
  },
  noRecommendationText: {
    textAlign: 'center',
    color: '#A855F7',
    padding: 15,
  },
});