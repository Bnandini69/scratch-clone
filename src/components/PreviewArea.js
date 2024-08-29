import React from "react";
import { useState, useContext, useEffect, useCallback, useRef } from "react";
import CatSprite from "./CatSprite";
import Draggable from "react-draggable";
import { Flag,RotateCcw, Undo2Icon } from "lucide-react";
import { GlobalContext } from "../App";
import { throttle } from "lodash";

export default function PreviewArea() {
  const { data } = useContext(GlobalContext);
  // state to handle position, text, size, animation
  const [spriteMotion, setSpriteMotion] = useState({
    position: { x: 0, y: 0 },
    rotation: 0,
    animation: null,
    text: { message: "", duration: 0, animation: false },
    size: 0,
  });
  const [playing, setPlaying] = useState(false);
  const [history, setHistory] = useState([]);
  const mousePositionRef = useRef({ x: 0, y: 0 });

  const pointTowardsMouse = () => {
    const rect = document.getElementById("sprite").getBoundingClientRect();
    const svgCenterX = rect.left + rect.width / 2;
    const svgCenterY = rect.top + rect.height / 2;
    const deltaX = mousePositionRef.current.x - svgCenterX;
    const deltaY = mousePositionRef.current.y - svgCenterY;
    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    if (angle < 0) {
      angle += 360;
    }
    return angle;
  };

  const startAnimation = useCallback(
    (eventType = "when_flag_clicked") => {
      if (data?.length) {
        const actions = data.filter((action) => action.type === eventType);

        if (actions.length) {
          setHistory((prevHistory) => [
            ...prevHistory,
            {
              position: spriteMotion.position,
              rotation: spriteMotion.rotation,
              size: spriteMotion.size,
              text: spriteMotion.text,
            },
          ]);

          actions.forEach(executeAction);
        }
      }
    },
    [data, spriteMotion]
  );

  const executeAction = (action) => {
    const { type, fields, next } = action;
    setPlaying(true);
    switch (type) {
      case "go_to":
        setSpriteMotion((prev) => ({
          ...prev,
          position: { x: fields.x_position, y: fields.y_position },
        }));
        break;
      case "go_to_random":
        setSpriteMotion((prev) => ({
          ...prev,
          position: { x: Math.random() * 400, y: Math.random() * 400 },
        }));
        break;
      case "clockwise":
        setSpriteMotion((prev) => ({
          ...prev,
          rotation: prev.rotation + fields.angle,
        }));
        break;
      case "anticlockwise":
        setSpriteMotion((prev) => ({
          ...prev,
          rotation: prev.rotation - fields.angle,
        }));
        break;
      case "glide":
        setSpriteMotion((prev) => ({
          ...prev,
          animation: { type: "glide", duration: fields.seconds * 1000 },
          position: { x: fields.x_position, y: fields.y_position },
        }));
        setTimeout(() => {
          setSpriteMotion((prev) => ({
            ...prev,
            animation: null,
          }));
        }, fields.seconds * 1000);
        break;
      case "glide_random":
        setSpriteMotion((prev) => ({
          ...prev,
          animation: { type: "glide", duration: fields.seconds * 1000 },
          position: { x: Math.random() * 400, y: Math.random() * 400 },
        }));
        setTimeout(() => {
          setSpriteMotion((prev) => ({
            ...prev,
            animation: null,
          }));
        }, fields.seconds * 1000);
        break;
      case "point_in_direction":
        setSpriteMotion((prev) => ({
          ...prev,
          rotation: fields.direction,
        }));

        break;
      case "point_towards":
        if (fields.target === "MOUSE_POINTER") {
          const updatedRotation = pointTowardsMouse();
          setSpriteMotion((prev) => ({
            ...prev,
            rotation: updatedRotation,
            animation: null,
          }));
        }
        break;
      case "move":
        setSpriteMotion((prev) => ({
          ...prev,
          position: {
            ...prev?.position,
            x: prev.position.x + fields.x_position,
          },
        }));

        break;
      case "change_x_by":
        setSpriteMotion((prev) => ({
          ...prev,
          position: { ...prev?.position, x: prev.position.x + fields.delta_x },
        }));
        break;
      case "set_x":
        setSpriteMotion((prev) => ({
          ...prev,
          position: { ...prev?.position, x: fields.x_position },
        }));
        break;
      case "change_y_by":
        setSpriteMotion((prev) => ({
          ...prev,
          position: { ...prev?.position, y: prev.position.y + fields.delta_y },
        }));

        break;
      case "set_y":
        setSpriteMotion((prev) => ({
          ...prev,
          position: { ...prev?.position, y: fields.y_position },
        }));

        break;
      case "say_for_seconds":
        setSpriteMotion((prev) => ({
          ...prev,
          text: {
            message: fields.message,
            duration: fields.seconds * 1000,
            animation: false,
          },
        }));

        setTimeout(
          () =>
            setSpriteMotion((prev) => ({
              ...prev,
              text: { message: "", duration: 0, animation: false },
            })),
          fields.seconds * 1000
        );
        break;
      case "say":
        setSpriteMotion((prev) => ({
          ...prev,
          text: {
            message: fields.message,
            duration: 100,
            animation: false,
          },
        }));
        break;
      case "think_for_seconds":
        setSpriteMotion((prev) => ({
          ...prev,
          text: {
            message: fields.message,
            duration: fields.seconds * 1000,
            animation: true,
          },
        }));

        setTimeout(
          () =>
            setSpriteMotion((prev) => ({
              ...prev,
              text: { message: "", duration: 0, animation: false },
            })),
          fields.seconds * 1000
        );
        break;
      case "think":
        setSpriteMotion((prev) => ({
          ...prev,
          text: {
            message: fields.message,
            duration: 100,
            animation: true,
          },
        }));

        break;
      case "change_size":
        setSpriteMotion((prev) => ({
          ...prev,
          size: prev.size + fields.size,
        }));

        break;
      default:
        break;
    }

    if (next && next.block) {
      setTimeout(() => executeAction(next.block), 10);
    } else {
      setPlaying(false);
    }
  };

  const undoAction = () => {
    if (history.length > 0) {
      const lastState = history[history.length - 1];
      setSpriteMotion({
        position: lastState.position,
        rotation: lastState.rotation,
        size: lastState.size,
        text: lastState.text,
      });
      setHistory(history.slice(0, -1));
    }
  };

  const reset = () => {
    setSpriteMotion({
      position: { x: 0, y: 0 },
      rotation: 0,
      animation: null,
      text: { message: "", duration: 0, animation: false },
      size: 0,
    });
    setHistory([]);
    setPlaying(false);
  };

  // const stop = () => { // This logic is not working as expected
  //   setPlaying(false);
  //   setAnimation(null);
  // };

  useEffect(() => {
    const handleMouseMove = throttle((event) => {
      mousePositionRef.current = { x: event.clientX, y: event.clientY };
    }, 200);

    const handleKeyDown = (event) => {
      if (event.code === "Space") {
        startAnimation("when_key_pressed");
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [startAnimation]);

  return (
    <div className="flex-none w-full">
      <div className="flex flex-row p-4 gap-4 justify-between pr-6">
        <div className="h-8 w-20 flex items-center justify-center">
           Scratch 
        </div>
        <div className="flex flex-row gap-4 justify-end z-10">
          {history.length > 0 && (
            <div
              onClick={undoAction}
              title="Undo"
              className="cursor-pointer self-center flex flex-row gap-1"
            >
              <p className="font-semibold">{history.length}</p>
              <Undo2Icon />
            </div>
          )}
          <div
            onClick={() => startAnimation("when_flag_clicked")}
            title={"Run"}
            className={`cursor-pointer self-center ${
              playing ? "pointer-events-none" : ""
            }`}
          >
            <Flag fill={playing ? "gray" : "green"} color="green" />
          </div>

          <div
            onClick={reset}
            title="Reset"
            className="cursor-pointer self-center"
          >
            <RotateCcw />
          </div>
        </div>
      </div>
      <Draggable className="h-[calc(100vh_-_4rem)] overflow-y-auto p-2 relative border">
        <div
          className="relative"
          style={{
            left: spriteMotion.position.x,
            top: spriteMotion.position.y,
            transition: spriteMotion.animation
              ? `${spriteMotion.animation.duration || 0}ms`
              : "none",
          }}
          onClick={() => startAnimation("when_sprite_clicked")}
        >
          <CatSprite
            style={{ transform: `rotate(${spriteMotion.rotation}deg)` }}
            size={spriteMotion.size}
            tooltipText={spriteMotion.text.message}
            showTooltip={spriteMotion.text.duration > 0}
            animation={spriteMotion.text?.animation}
          />
        </div>
      </Draggable>
    </div>
  );
}
