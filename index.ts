import "expo-router/entry";
import "./src/services/currentTaskNotification";
import { registerWidgetTaskHandler } from "react-native-android-widget";
import { widgetTaskHandler } from "./src/widget/widgetTaskHandler";

registerWidgetTaskHandler(widgetTaskHandler);