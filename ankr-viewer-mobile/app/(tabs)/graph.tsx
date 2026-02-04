import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../../src/context/store';
import { api } from '../../src/services/api';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/utils/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const generateGraphHTML = (nodes: any[], links: any[], theme: any) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: ${theme.background};
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    svg { width: 100%; height: 100vh; }
    .node circle {
      stroke: ${theme.border};
      stroke-width: 2px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .node circle:hover {
      stroke-width: 3px;
      filter: brightness(1.2);
    }
    .node text {
      fill: ${theme.text};
      font-size: 10px;
      pointer-events: none;
      text-anchor: middle;
    }
    .link {
      stroke: ${theme.border};
      stroke-opacity: 0.6;
    }
    .tooltip {
      position: absolute;
      background: ${theme.surface};
      border: 1px solid ${theme.border};
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 12px;
      color: ${theme.text};
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
  </style>
</head>
<body>
  <div class="tooltip" id="tooltip"></div>
  <svg id="graph"></svg>
  <script>
    const nodes = ${JSON.stringify(nodes)};
    const links = ${JSON.stringify(links)};

    const width = window.innerWidth;
    const height = window.innerHeight;

    const colorMap = {
      document: '${theme.primary}',
      topic: '${theme.secondary}',
      tag: '${theme.accent}'
    };

    const svg = d3.select('#graph')
      .attr('viewBox', [0, 0, width, height]);

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('class', 'link')
      .attr('stroke-width', d => Math.sqrt(d.strength || 1));

    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    node.append('circle')
      .attr('r', d => d.type === 'topic' ? 20 : 12)
      .attr('fill', d => colorMap[d.type] || '${theme.primary}');

    node.append('text')
      .text(d => d.name.length > 12 ? d.name.slice(0, 12) + '...' : d.name)
      .attr('dy', d => d.type === 'topic' ? 35 : 25);

    const tooltip = d3.select('#tooltip');

    node.on('mouseover', function(event, d) {
      tooltip
        .style('opacity', 1)
        .html('<strong>' + d.name + '</strong><br/>Type: ' + d.type + (d.count ? '<br/>Docs: ' + d.count : ''))
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    })
    .on('mouseout', function() {
      tooltip.style('opacity', 0);
    })
    .on('click', function(event, d) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'nodeClick', node: d }));
    });

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node.attr('transform', d => 'translate(' + d.x + ',' + d.y + ')');
    });

    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 4])
      .on('zoom', (event) => {
        svg.selectAll('g').attr('transform', event.transform);
      });

    svg.call(zoom);
  </script>
</body>
</html>
`;

export default function GraphScreen() {
  const router = useRouter();
  const { settings } = useAppStore();
  const theme = colors[settings.theme === 'light' ? 'light' : 'dark'];
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'graph' | 'topics'>('graph');
  const webViewRef = useRef<WebView>(null);

  const { data: graphData, isLoading: graphLoading } = useQuery({
    queryKey: ['knowledge-graph'],
    queryFn: () => api.getKnowledgeGraph(),
    staleTime: 60000,
  });

  const { data: topics = [], isLoading: topicsLoading } = useQuery({
    queryKey: ['topics'],
    queryFn: () => api.getTopics(),
    staleTime: 60000,
  });

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'nodeClick') {
        setSelectedNode(data.node);
      }
    } catch (e) {
      console.error('WebView message parse error:', e);
    }
  };

  const sampleNodes = graphData?.nodes || [
    { id: '1', name: 'Documentation', type: 'topic', count: 45 },
    { id: '2', name: 'API Reference', type: 'topic', count: 32 },
    { id: '3', name: 'Guides', type: 'topic', count: 28 },
    { id: '4', name: 'Architecture', type: 'topic', count: 15 },
    { id: '5', name: 'Integration', type: 'topic', count: 22 },
    { id: '6', name: 'Security', type: 'tag', count: 18 },
    { id: '7', name: 'Performance', type: 'tag', count: 12 },
  ];

  const sampleLinks = graphData?.links || [
    { source: '1', target: '2', strength: 3 },
    { source: '1', target: '3', strength: 2 },
    { source: '2', target: '4', strength: 2 },
    { source: '3', target: '5', strength: 1 },
    { source: '4', target: '6', strength: 2 },
    { source: '5', target: '7', strength: 1 },
  ];

  const isLoading = graphLoading || topicsLoading;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* View Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'graph' && { backgroundColor: theme.primary },
            { borderColor: theme.border },
          ]}
          onPress={() => setViewMode('graph')}
        >
          <Ionicons
            name="git-network-outline"
            size={18}
            color={viewMode === 'graph' ? '#fff' : theme.textSecondary}
          />
          <Text
            style={[
              styles.toggleText,
              { color: viewMode === 'graph' ? '#fff' : theme.textSecondary },
            ]}
          >
            Graph
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'topics' && { backgroundColor: theme.primary },
            { borderColor: theme.border },
          ]}
          onPress={() => setViewMode('topics')}
        >
          <Ionicons
            name="pricetags-outline"
            size={18}
            color={viewMode === 'topics' ? '#fff' : theme.textSecondary}
          />
          <Text
            style={[
              styles.toggleText,
              { color: viewMode === 'topics' ? '#fff' : theme.textSecondary },
            ]}
          >
            Topics
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading knowledge graph...
          </Text>
        </View>
      ) : viewMode === 'graph' ? (
        <View style={styles.graphContainer}>
          <WebView
            ref={webViewRef}
            source={{ html: generateGraphHTML(sampleNodes, sampleLinks, theme) }}
            style={styles.webview}
            onMessage={handleWebViewMessage}
            scrollEnabled={false}
            bounces={false}
          />

          {/* Legend */}
          <View style={[styles.legend, { backgroundColor: theme.surface }, shadows.md]}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.primary }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>Document</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.secondary }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>Topic</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.accent }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>Tag</Text>
            </View>
          </View>

          {/* Selected Node Info */}
          {selectedNode && (
            <View style={[styles.nodeInfo, { backgroundColor: theme.surface }, shadows.lg]}>
              <View style={styles.nodeInfoHeader}>
                <Text style={[styles.nodeInfoTitle, { color: theme.text }]}>
                  {selectedNode.name}
                </Text>
                <TouchableOpacity onPress={() => setSelectedNode(null)}>
                  <Ionicons name="close" size={24} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.nodeInfoType, { color: theme.textSecondary }]}>
                Type: {selectedNode.type}
              </Text>
              {selectedNode.count && (
                <Text style={[styles.nodeInfoCount, { color: theme.textSecondary }]}>
                  Documents: {selectedNode.count}
                </Text>
              )}
              <TouchableOpacity
                style={[styles.viewButton, { backgroundColor: theme.primary }]}
                onPress={() => router.push('/(tabs)/files')}
              >
                <Text style={styles.viewButtonText}>View Related Files</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <ScrollView style={styles.topicsContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.topicsGrid}>
            {(topics.length > 0 ? topics : sampleNodes.filter((n) => n.type === 'topic')).map(
              (topic: any) => (
                <TouchableOpacity
                  key={topic.id || topic.name}
                  style={[styles.topicCard, { backgroundColor: theme.surface }, shadows.sm]}
                  onPress={() => router.push('/(tabs)/files')}
                >
                  <View style={[styles.topicIcon, { backgroundColor: `${theme.secondary}20` }]}>
                    <Ionicons name="pricetag" size={24} color={theme.secondary} />
                  </View>
                  <Text style={[styles.topicName, { color: theme.text }]} numberOfLines={2}>
                    {topic.name}
                  </Text>
                  <Text style={[styles.topicCount, { color: theme.textMuted }]}>
                    {topic.count || 0} documents
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  toggleText: {
    ...typography.label,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    marginTop: spacing.md,
  },
  graphContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  legend: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  legendText: {
    ...typography.caption,
  },
  nodeInfo: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  nodeInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  nodeInfoTitle: {
    ...typography.h4,
  },
  nodeInfoType: {
    ...typography.bodySmall,
    marginBottom: spacing.xs,
  },
  nodeInfoCount: {
    ...typography.bodySmall,
    marginBottom: spacing.md,
  },
  viewButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  viewButtonText: {
    ...typography.label,
    color: '#fff',
  },
  topicsContainer: {
    flex: 1,
    padding: spacing.md,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  topicCard: {
    width: (SCREEN_WIDTH - spacing.md * 3) / 2,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  topicIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  topicName: {
    ...typography.label,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  topicCount: {
    ...typography.caption,
  },
});
