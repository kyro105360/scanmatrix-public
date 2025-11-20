import { StyleSheet, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: "#0d0d0d",
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },

  // Top Bar
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 20,
    paddingBottom: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "rgba(13, 13, 13, 0.95)",
    zIndex: 10,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "400",
  },
  logoutButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 107, 107, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },


  // Camera Container
  cameraContainer: {
    flex: 1,
    marginTop: 100,
    marginBottom: 120,
    marginHorizontal: 20,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#000000",
    shadowColor: "#00e6e6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 20,
  },
  camera: {
    flex: 1,
  },

  // Scanning Overlay
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  scanningFrame: {
    width: 250,
    height: 250,
    position: "relative",
  },

  // Scanning Frame Corners
  corner: {
    position: "absolute",
    width: 20,
    height: 20,
    borderColor: "#00ff88",
    borderWidth: 2,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },

  // Bottom Control Bar
  bottomControlBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 15,
    paddingBottom: 25,
    paddingHorizontal: 30,
    backgroundColor: "rgba(13, 13, 13, 0.95)",
    borderTopWidth: 0.5,
    borderTopColor: "rgba(0, 230, 230, 0.2)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  // Control Buttons
  controlButton: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
  },
  controlButtonText: {
    color: "#00e6e6",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
    letterSpacing: 0.5,
  },

  // Main Scan Button
  scanButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 50,
    elevation: 10,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  scanButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#00e6e6",
    justifyContent: "center",
    alignItems: "center",
  },

  // Stabilization / Ready-to-Scan Indicator
  stabilizationIndicator: {
    position: "absolute",
    bottom: 80,
    alignSelf: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 136, 0.5)",
  },
  stabilizationDots: {
    flexDirection: "row",
    marginBottom: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#00ff88",
    marginHorizontal: 2,
  },
  stabilizationText: {
    color: "#00ff88",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  // Sidebar Menu
  sidebarOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    flexDirection: "row",
  },
  sidebarBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
sidebar: {
  width: 250,
  backgroundColor: "rgba(13, 13, 13, 0.95)",
  borderRadius: 20,
  paddingTop: 50,
  paddingHorizontal: 20,

  // Neon Glow Shadow
  shadowColor: "#00e6e6",
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.6,
  shadowRadius: 2,
  elevation: 25,

  borderWidth: 1,
  borderColor: "rgba(0, 230, 230, 0.3)",
},
  sidebarHeader: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 230, 230, 0.2)",
    alignItems: "center",
  },
  sidebarUserName: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 2,
  },
  sidebarUserEmail: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    fontWeight: "400",
  },
  sidebarItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#00e6e6",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -10,
  },
  avatarText: {
    color: "#0d0d1a",
    fontSize: 24,
    fontWeight: "700",
  },

  sidebarItemText: {
    color: "#00e6e6",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 16,
    letterSpacing: 0.3,
  },
  zoomControls: {
    position: "absolute",
    bottom: 120,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  zoomButton: {
    backgroundColor: "#00e6e6",
    borderRadius: 25,
    padding: 10,
    marginHorizontal: 10,
  },
  zoomButtonText: { fontSize: 20, color: "#000" },
  zoomLevelText: { fontSize: 16, color: "#fff" },

});


export default styles;
