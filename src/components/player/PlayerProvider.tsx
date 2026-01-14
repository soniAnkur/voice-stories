"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useRef,
  useEffect,
  useCallback,
} from "react";
import type {
  PlayerState,
  PlayerAction,
  PlayerContextType,
  StoryForPlayer,
} from "@/types/player";

const initialState: PlayerState = {
  currentStory: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  queue: [],
  queueIndex: 0,
  isExpanded: false,
  isMiniVisible: false,
};

function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case "PLAY_STORY": {
      const queue = action.queue || [action.story];
      const queueIndex = queue.findIndex((s) => s._id === action.story._id);
      return {
        ...state,
        currentStory: action.story,
        queue,
        queueIndex: queueIndex >= 0 ? queueIndex : 0,
        isPlaying: true,
        isMiniVisible: true,
        currentTime: 0,
        duration: 0,
      };
    }
    case "TOGGLE_PLAY":
      return {
        ...state,
        isPlaying: !state.isPlaying,
      };
    case "PAUSE":
      return {
        ...state,
        isPlaying: false,
      };
    case "SEEK":
      return {
        ...state,
        currentTime: action.time,
      };
    case "NEXT": {
      const nextIndex = state.queueIndex + 1;
      if (nextIndex >= state.queue.length) {
        return state;
      }
      return {
        ...state,
        queueIndex: nextIndex,
        currentStory: state.queue[nextIndex],
        isPlaying: true,
        currentTime: 0,
        duration: 0,
      };
    }
    case "PREVIOUS": {
      // If more than 3 seconds in, restart current track
      if (state.currentTime > 3) {
        return {
          ...state,
          currentTime: 0,
        };
      }
      const prevIndex = state.queueIndex - 1;
      if (prevIndex < 0) {
        return {
          ...state,
          currentTime: 0,
        };
      }
      return {
        ...state,
        queueIndex: prevIndex,
        currentStory: state.queue[prevIndex],
        isPlaying: true,
        currentTime: 0,
        duration: 0,
      };
    }
    case "EXPAND":
      return {
        ...state,
        isExpanded: true,
      };
    case "COLLAPSE":
      return {
        ...state,
        isExpanded: false,
      };
    case "UPDATE_TIME":
      return {
        ...state,
        currentTime: action.time,
      };
    case "SET_DURATION":
      return {
        ...state,
        duration: action.duration,
      };
    case "TRACK_ENDED": {
      const nextIndex = state.queueIndex + 1;
      if (nextIndex >= state.queue.length) {
        // End of queue
        return {
          ...state,
          isPlaying: false,
          currentTime: 0,
        };
      }
      // Auto-play next track
      return {
        ...state,
        queueIndex: nextIndex,
        currentStory: state.queue[nextIndex],
        isPlaying: true,
        currentTime: 0,
        duration: 0,
      };
    }
    case "CLOSE":
      return {
        ...initialState,
      };
    default:
      return state;
  }
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(playerReducer, initialState);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync audio element with state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (state.currentStory?.fullAudioUrl) {
      // Only update src if it changed
      if (audio.src !== state.currentStory.fullAudioUrl) {
        audio.src = state.currentStory.fullAudioUrl;
        audio.load();
      }
    }
  }, [state.currentStory]);

  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !state.currentStory) return;

    if (state.isPlaying) {
      audio.play().catch((err) => {
        console.error("Error playing audio:", err);
        dispatch({ type: "PAUSE" });
      });
    } else {
      audio.pause();
    }
  }, [state.isPlaying, state.currentStory]);

  // Handle seek from state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Only seek if the difference is significant (to avoid loops)
    if (Math.abs(audio.currentTime - state.currentTime) > 1) {
      audio.currentTime = state.currentTime;
    }
  }, [state.currentTime]);

  // Audio event handlers
  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      dispatch({ type: "UPDATE_TIME", time: audio.currentTime });
    }
  }, []);

  const handleDurationChange = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.duration && !isNaN(audio.duration)) {
      dispatch({ type: "SET_DURATION", duration: audio.duration });
    }
  }, []);

  const handleEnded = useCallback(() => {
    dispatch({ type: "TRACK_ENDED" });
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.duration && !isNaN(audio.duration)) {
      dispatch({ type: "SET_DURATION", duration: audio.duration });
    }
  }, []);

  // Set up audio element
  useEffect(() => {
    // Create audio element if not exists
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "metadata";
    }

    const audio = audioRef.current;

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [handleTimeUpdate, handleDurationChange, handleEnded, handleLoadedMetadata]);

  return (
    <PlayerContext.Provider value={{ state, dispatch, audioRef }}>
      {children}
    </PlayerContext.Provider>
  );
}
