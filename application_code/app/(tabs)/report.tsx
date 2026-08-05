import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
  Animated,
  StatusBar,
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

// Define types for our data
type EmotionType = 'happy' | 'neutral' | 'sad';

interface EmotionSummary {
  happy: number;
  neutral: number;
  sad: number;
  lastEmotion: string;
}

interface Recommendations {
  music: string;
  book: string;
  movie: string;
  activity: string;
}

interface ReportData {
  emotionSummary: EmotionSummary;
  recommendations: Recommendations;
  recentSessions: number;
  progress: number;
}

interface RecommendationCard {
  id: string;
  title: string;
  icon: string;
  content: string;
  color: string;
}

const EmotionIcon = ({ type }: { type: EmotionType }) => {
  const icons = {
    happy: '😊',
    neutral: '😐',
    sad: '😢',
  };
  return <Text style={styles.emotionIcon}>{icons[type]}</Text>;
};

export default function ReportScreen() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<RecommendationCard | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const mockData = await new Promise<ReportData>((resolve) =>
          setTimeout(() => {
            resolve({
              emotionSummary: {
                happy: 45,
                neutral: 35,
                sad: 20,
                lastEmotion: '😊 Happy',
              },
              recommendations: {
                music: '"Good Vibes" by XYZ',
                book: '"Atomic Habits" by James Clear',
                movie: '"Inside Out"',
                activity: 'Meditation session - 10 minutes',
              },
              recentSessions: 3,
              progress: 72,
            });
          }, 1000)
        );
        setReportData(mockData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderPieChart = () => {
    if (!reportData) return null;
    
    const { happy, neutral, sad } = reportData.emotionSummary;

    const data = [
      { name: 'Happy', population: happy, color: '#4CAF50', legendFontColor: '#333', legendFontSize: 14 },
      { name: 'Neutral', population: neutral, color: '#2196F3', legendFontColor: '#333', legendFontSize: 14 },
      { name: 'Sad', population: sad, color: '#F44336', legendFontColor: '#333', legendFontSize: 14 },
    ];

    return (
      <Animatable.View animation="fadeIn" duration={800} delay={200} style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Mood Distribution</Text>
        <PieChart
          data={data}
          width={width - 60}
          height={200}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            color: (opacity = 1) => `rgba(106, 27, 154, ${opacity})`,
            style: { borderRadius: 16 },
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
          hasLegend={true}
          center={[width / 6, 0]}
        />
      </Animatable.View>
    );
  };

  const renderProgressRing = () => {
    if (!reportData) return null;
    
    return (
      <Animatable.View animation="fadeIn" duration={800} delay={400} style={styles.progressContainer}>
        <View style={styles.progressRing}>
          <View style={[styles.progressFill, { width: `${reportData.progress}%` }]} />
          <Text style={styles.progressText}>{reportData.progress}%</Text>
        </View>
        <Text style={styles.progressLabel}>Wellness Progress</Text>
      </Animatable.View>
    );
  };

  const renderEmotionSummary = () => {
    if (!reportData) return null;
    
    return (
      <Animatable.View animation="fadeInUp" duration={800} delay={300} style={styles.glassCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.sectionTitle}>Emotion Summary</Text>
          <EmotionIcon type="happy" />
        </View>
        
        <View style={styles.emotionBarContainer}>
          <Text style={styles.emotionLabel}>Happy</Text>
          <View style={styles.emotionBarBg}>
            <Animatable.View 
              animation="fadeInLeft" 
              duration={1000} 
              delay={500} 
              style={[styles.emotionBar, { width: `${reportData.emotionSummary.happy}%`, backgroundColor: '#4CAF50' }]} 
            />
          </View>
          <Text style={styles.emotionPercentage}>{reportData.emotionSummary.happy}%</Text>
        </View>
        
        <View style={styles.emotionBarContainer}>
          <Text style={styles.emotionLabel}>Neutral</Text>
          <View style={styles.emotionBarBg}>
            <Animatable.View 
              animation="fadeInLeft" 
              duration={1000} 
              delay={700} 
              style={[styles.emotionBar, { width: `${reportData.emotionSummary.neutral}%`, backgroundColor: '#2196F3' }]} 
            />
          </View>
          <Text style={styles.emotionPercentage}>{reportData.emotionSummary.neutral}%</Text>
        </View>
        
        <View style={styles.emotionBarContainer}>
          <Text style={styles.emotionLabel}>Sad</Text>
          <View style={styles.emotionBarBg}>
            <Animatable.View 
              animation="fadeInLeft" 
              duration={1000} 
              delay={900} 
              style={[styles.emotionBar, { width: `${reportData.emotionSummary.sad}%`, backgroundColor: '#F44336' }]} 
            />
          </View>
          <Text style={styles.emotionPercentage}>{reportData.emotionSummary.sad}%</Text>
        </View>
        
        <View style={styles.divider} />
        <Text style={styles.reportDetail}>Last recorded emotion: {reportData.emotionSummary.lastEmotion}</Text>
      </Animatable.View>
    );
  };

  const renderActivitySummary = () => {
    if (!reportData) return null;
    
    return (
      <Animatable.View animation="fadeInUp" duration={800} delay={400} style={styles.miniCardContainer}>
        <View style={styles.miniCard}>
          <Text style={styles.miniCardValue}>{reportData.recentSessions}</Text>
          <Text style={styles.miniCardLabel}>Recent Sessions</Text>
        </View>
        <View style={styles.miniCard}>
          <Text style={styles.miniCardValue}>{reportData.emotionSummary.happy}%</Text>
          <Text style={styles.miniCardLabel}>Positivity</Text>
        </View>
      </Animatable.View>
    );
  };

  const renderRecommendations = () => {
    if (!reportData) return null;
    
    const items: RecommendationCard[] = [
      { id: '1', title: 'Music', icon: '🎵', content: reportData.recommendations.music, color: '#4CAF50' },
      { id: '2', title: 'Book', icon: '📖', content: reportData.recommendations.book, color: '#2196F3' },
      { id: '3', title: 'Movie', icon: '🎬', content: reportData.recommendations.movie, color: '#F44336' },
      { id: '4', title: 'Activity', icon: '🧘', content: reportData.recommendations.activity, color: '#FF9800' },
    ];

    return (
      <>
        <Text style={[styles.sectionTitle, { marginTop: 20, marginLeft: 20 }]}>Today's Recommendations</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollContent}
        >
          {items.map((item, index) => (
            <Animatable.View 
              key={item.id} 
              animation="fadeInRight" 
              duration={800} 
              delay={500 + (index * 100)}
            >
              <TouchableOpacity onPress={() => setSelectedCard(item)}>
                <LinearGradient
                  colors={[item.color, shadeColor(item.color, 20)]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.recommendationCard}
                >
                  <Text style={styles.cardIcon}>{item.icon}</Text>
                  <Text style={styles.cardLabel}>{item.title}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animatable.View>
          ))}
        </ScrollView>
        <Modal visible={!!selectedCard} transparent animationType="fade">
          <BlurView intensity={80} style={styles.modalOverlay} tint="dark">
            <Animatable.View animation="zoomIn" duration={300} style={styles.zoomCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalIcon}>{selectedCard?.icon}</Text>
                <Text style={styles.modalTitle}>{selectedCard?.title}</Text>
              </View>
              <Text style={styles.cardContent}>{selectedCard?.content}</Text>
              <TouchableOpacity 
                onPress={() => setSelectedCard(null)}
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </Animatable.View>
          </BlurView>
        </Modal>
      </>
    );
  };

  // Helper function to darken colors
  const shadeColor = (color: string, percent: number): string => {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = parseInt(String((R * (100 - percent)) / 100));
    G = parseInt(String((G * (100 - percent)) / 100));
    B = parseInt(String((B * (100 - percent)) / 100));

    R = R < 255 ? R : 255;
    G = G < 255 ? G : 255;
    B = B < 255 ? B : 255;

    const RR = R.toString(16).length === 1 ? '0' + R.toString(16) : R.toString(16);
    const GG = G.toString(16).length === 1 ? '0' + G.toString(16) : G.toString(16);
    const BB = B.toString(16).length === 1 ? '0' + B.toString(16) : B.toString(16);

    return `#${RR}${GG}${BB}`;
  };

  // Animated header based on scroll position
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [180, 80],
    extrapolate: 'clamp',
  });

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [0, 60, 90],
    outputRange: [1, 0.3, 0],
    extrapolate: 'clamp',
  });

  const headerSubtitleOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const compactHeaderOpacity = scrollY.interpolate({
    inputRange: [60, 90],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.mainContainer}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <LinearGradient
          colors={['#6A1B9A', '#8E24AA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <Animated.View style={{ opacity: headerTitleOpacity }}>
            <Text style={styles.headerTitle}>Your Wellness Report</Text>
            <Animated.Text style={[styles.headerSubtitle, { opacity: headerSubtitleOpacity }]}>
              Insights from recent sessions
            </Animated.Text>
          </Animated.View>
          
          <Animated.View style={[styles.compactHeader, { opacity: compactHeaderOpacity }]}>
            <Text style={styles.compactHeaderText}>Wellness Report</Text>
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6A1B9A" />
          <Text style={styles.loadingText}>Generating your wellness insights...</Text>
        </View>
      ) : (
        <Animated.ScrollView 
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
        >
          <View style={styles.contentPadding} />
          
          {renderActivitySummary()}
          {renderEmotionSummary()}
          {renderProgressRing()}
          {renderPieChart()}
          {renderRecommendations()}
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Tap on a recommendation for details</Text>
          </View>
        </Animated.ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8F8FC',
  },
  container: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  contentPadding: {
    height: 160,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    overflow: 'hidden',
  },
  headerGradient: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 6,
  },
  compactHeader: {
    position: 'absolute',
    bottom: 15,
    left: 20,
  },
  compactHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6A1B9A',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#512DA8',
    marginBottom: 12,
  },
  reportDetail: {
    fontSize: 16,
    color: '#555',
    marginTop: 5,
  },
  glassCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  emotionIcon: {
    fontSize: 24,
  },
  emotionBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  emotionLabel: {
    width: 60,
    fontSize: 14,
    color: '#555',
  },
  emotionBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#EEEEEE',
    borderRadius: 4,
    overflow: 'hidden',
  },
  emotionBar: {
    height: '100%',
    borderRadius: 4,
  },
  emotionPercentage: {
    width: 40,
    textAlign: 'right',
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 15,
  },
  miniCardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  miniCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 15,
    width: '48%',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  miniCardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#512DA8',
  },
  miniCardLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  progressContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 10,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  progressRing: {
    width: width - 100,
    height: 20,
    backgroundColor: '#EEEEEE',
    borderRadius: 10,
    justifyContent: 'center',
    overflow: 'hidden',
    marginVertical: 10,
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#7C4DFF',
    borderRadius: 10,
  },
  progressText: {
    color: '#FFF',
    fontWeight: '700',
    textAlign: 'center',
    zIndex: 1,
    fontSize: 12,
  },
  progressLabel: {
    fontSize: 16,
    color: '#555',
    marginTop: 8,
  },
  horizontalScrollContent: {
    paddingHorizontal: 15,
  },
  recommendationCard: {
    width: 120,
    height: 150,
    marginHorizontal: 5,
    borderRadius: 16,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  cardIcon: {
    fontSize: 36,
    marginBottom: 15,
    textAlign: 'center',
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomCard: {
    backgroundColor: '#FFF',
    padding: 25,
    borderRadius: 20,
    width: width * 0.85,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#512DA8',
  },
  cardContent: {
    fontSize: 18,
    color: '#444',
    textAlign: 'center',
    lineHeight: 26,
  },
  closeButton: {
    marginTop: 25,
    backgroundColor: '#7C4DFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignSelf: 'center',
  },
  closeText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    paddingBottom: 10,
  },
  footerText: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
});