import { StyleSheet, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export default StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: "#0d0d1a",
    paddingTop: 60,
    paddingHorizontal: 16,
  },

  // === HomeScreen-style Top Bar ===
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 20,
    paddingBottom: 25,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "rgba(13, 13, 13, 0.95)",
    zIndex: 10,
  },
  titleContainer: {
    flexDirection: "column",
  },
  title: {
    fontSize: 25,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "400",
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
  menuIcon: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "700",
  },

  // Card
  card: {
    backgroundColor: "rgba(20,10,50,0.7)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#00e6e6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 8,
  },
  barcodeImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  timestamp: {
    color: "#ccc",
    fontSize: 14,
    marginBottom: 12,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    color: "#fff",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },

  // Action Buttons
  actionButton: {
    flex: 1,
    backgroundColor: "#00e6e6",
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#0d0d1a",
    fontWeight: "600",
  },

  empty: {
    color: "#888",
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
  },

  // === Sidebar Styles ===
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
    flexDirection: "row",
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
    marginLeft: 12,
  },
  sidebarItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  sidebarItemText: {
    color: "#00e6e6",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 16,
    letterSpacing: 0.3,
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

// === Filters & Date Pickers ===
filtersContainer: {
  marginTop: 40, // smaller gap from top bar
  paddingHorizontal: 20,
  paddingBottom: 10,
  flexDirection: 'row',
  justifyContent: 'space-between',
  zIndex: 50,
},
filterButton: {
  flex: 1,
  paddingVertical: 8,
  paddingHorizontal: 10,
  backgroundColor: "rgba(0,230,230,0.1)",
  borderRadius: 8,
  alignItems: 'center',
  marginHorizontal: 4,
},
filterButtonText: {
  color: "#00e6e6",
  fontSize: 13,
  textAlign: 'center',
},
datePickerContainer: {
  position: 'absolute',
  top: 80,
  left: 20,
  right: 20,
  backgroundColor: 'rgba(13,13,13,0.95)',
  borderRadius: 12,
  padding: 10,
  zIndex: 999,
},

});
