import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import {
  getWidgetData,
  toggleRoutineStatus,
} from "../services/routineData";
import { TodayWidget } from "./TodayWidget";

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  switch (props.widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE":
    case "WIDGET_RESIZED": {
      const data = await getWidgetData();
      props.renderWidget(
        <TodayWidget
          day={data.day}
          stats={data.stats}
          items={data.items}
          width={props.widgetInfo.width}
          height={props.widgetInfo.height}
        />,
      );
      break;
    }

    case "WIDGET_CLICK": {
      if (props.clickAction === "TOGGLE_STATUS") {
        const id = props.clickActionData?.id;
        if (typeof id !== "string") break;
        await toggleRoutineStatus(id);
        const data = await getWidgetData();
        props.renderWidget(
          <TodayWidget
            day={data.day}
            stats={data.stats}
            items={data.items}
            width={props.widgetInfo.width}
            height={props.widgetInfo.height}
          />,
        );
      }
      break;
    }

    default:
      break;
  }
}
