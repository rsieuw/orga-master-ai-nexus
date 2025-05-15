import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from "@/hooks/useAuth.ts"; // Assuming useAuth provides user and updateUser
import { useToast } from "@/hooks/use-toast.ts"; // Added import
import { useTranslation } from 'react-i18next'; // Added import

/**
 * Type for the user's layout preference.
 * Determines the distribution of the two columns in the interface.
 */
export type LayoutPreference = '50-50' | '33-67';

/**
 * Props for the useResizableLayout hook.
 * 
 * @interface UseResizableLayoutProps
 */
interface UseResizableLayoutProps {
  /** Initial layout preference used if the user has not set a preference */
  initialLayoutPreference?: LayoutPreference;
  /** Minimum width of the left column in pixels */
  leftColumnMinWidth?: number;
  /** Minimum width of the right column in pixels */
  rightColumnMinWidth?: number;
}

/**
 * Return type for the useResizableLayout hook.
 * 
 * @interface UseResizableLayoutReturn
 */
interface UseResizableLayoutReturn {
  /** The current dimensions of both columns as a percentage */
  columnSizes: { left: number; right: number };
  /** Ref to be applied to the container element */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Function to start resizing, should be used as onMouseDown event handler on the resize element */
  startResize: (e: React.MouseEvent<HTMLDivElement>) => void;
  /** Boolean indicating whether resizing is currently active */
  isResizing: boolean;
}

/**
 * Hook that implements a resizable layout with two columns.
 * 
 * Provides functionality for:
 * - Adjusting column width by dragging
 * - Storing user preferences
 * - Restoring saved preferences
 * - Limiting minimum column width
 * 
 * @param {UseResizableLayoutProps} props - Configuration options for the resizable layout
 * @returns {UseResizableLayoutReturn} Object with state and functions for the resizable layout
 */
export function useResizableLayout({
  initialLayoutPreference = '50-50',
  leftColumnMinWidth = 200, // Minimum width for the left column in pixels
  rightColumnMinWidth = 200, // Minimum width for the right column in pixels
}: UseResizableLayoutProps = {}): UseResizableLayoutReturn {
  const { user, updateUser } = useAuth();
  const { toast } = useToast(); // Added useToast
  const { t } = useTranslation(); // Added useTranslation

  /**
   * Converts a layout preference (string) to concrete column percentages.
   * 
   * @param {LayoutPreference | undefined | null} preference - The user's preferred layout
   * @returns {{ left: number, right: number }} Object with column widths as percentages
   */
  const calculateColumnSizesFromPreference = useCallback((preference: LayoutPreference | undefined | null) => {
    if (preference === '33-67') {
      return { left: 33.33, right: 66.67 };
    }
    return { left: 50, right: 50 }; // Default to 50-50
  }, []);

  const [columnSizes, setColumnSizes] = useState<{ left: number; right: number }>(() =>
    calculateColumnSizesFromPreference(user?.layout_preference as LayoutPreference || initialLayoutPreference)
  );
  const [isResizing, setIsResizing] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const initialX = useRef<number>(0);
  const initialLeftWidth = useRef<number>(0);
  const hasAppliedInitialLayoutRef = useRef(false);
  const saveLayoutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedPreferenceRef = useRef<LayoutPreference | null>(null);
  const prevIsResizingRef = useRef<boolean>(false);

  /**
   * Effect to set initial column sizes and update if user.layout_preference changes.
   */
  useEffect(() => {
    if (user && !hasAppliedInitialLayoutRef.current) {
      const newSizes = calculateColumnSizesFromPreference(user.layout_preference as LayoutPreference || initialLayoutPreference);
      setColumnSizes(newSizes);
      lastSavedPreferenceRef.current = user.layout_preference as LayoutPreference || initialLayoutPreference;
      hasAppliedInitialLayoutRef.current = true;
    }
  }, [user, initialLayoutPreference, calculateColumnSizesFromPreference]);

  /**
   * Saves the current layout preference with a delay to avoid frequent updates.
   */
  const debounceSaveLayoutPreference = useCallback(() => {
    if (saveLayoutTimeoutRef.current) {
      clearTimeout(saveLayoutTimeoutRef.current);
    }

    saveLayoutTimeoutRef.current = setTimeout(() => {
      if (user && columnSizes) {
        const snapThreshold = (33.33 + 50) / 2;
        const newPreference: LayoutPreference = columnSizes.left <= snapThreshold ? '33-67' : '50-50';
        
        if (newPreference !== user.layout_preference && newPreference !== lastSavedPreferenceRef.current) {
          (async () => {
            try {
              await updateUser({ layout_preference: newPreference });
              lastSavedPreferenceRef.current = newPreference;
              // Call toast here after successful update
              toast({
                title: t('settings.toast.layoutPreferenceSaved.title'),
                description: t('settings.toast.layoutPreferenceSaved.description'),
              });
            } catch (error) {
              console.error("Error saving layout preference:", error);
              // Optionally, show an error toast here as well
              toast({
                variant: "destructive",
                title: t('settings.toast.errorSavingLayoutPreference.title'),
                description: t('settings.toast.errorSavingLayoutPreference.description'),
              });
            }
          })();
        }
      }
    }, 1000);
  }, [user, updateUser, columnSizes, toast, t]); // Added toast and t to dependencies

  /**
   * Effect that handles changes in isResizing status and saves accordingly.
   */
  useEffect(() => {
    const wasResizingInPreviousRender = prevIsResizingRef.current;

    if (isResizing) {
      // Currently resizing - doResize handles updates, don't override
      return;
    }
    
    // This means resizing just finished in the previous render cycle
    if (wasResizingInPreviousRender && !isResizing) {
      debounceSaveLayoutPreference();
      return;
    }
    
    // Apply preference from user object if it's available and different
    // or if it hasn't been applied yet.
    if (user) {
      const currentPreferenceInState = columnSizes.left <= (33.33 + 50) / 2 ? '33-67' : '50-50';
      const userPreference = user.layout_preference as LayoutPreference || initialLayoutPreference;

      if (!hasAppliedInitialLayoutRef.current || userPreference !== currentPreferenceInState) {
        const newSizes = calculateColumnSizesFromPreference(userPreference);
        setColumnSizes(newSizes);
        lastSavedPreferenceRef.current = userPreference;
        if (!hasAppliedInitialLayoutRef.current) {
            hasAppliedInitialLayoutRef.current = true;
        }
      }
    }
  }, [user, isResizing, calculateColumnSizesFromPreference, debounceSaveLayoutPreference, columnSizes, initialLayoutPreference]);

  /**
   * Effect to keep track of the previous isResizing status.
   */
  useEffect(() => {
    prevIsResizingRef.current = isResizing;
  }, [isResizing]);

  /**
   * Starts the resize process by storing the initial position and width.
   * 
   * @param {React.MouseEvent<HTMLDivElement>} e - The mouse event that starts the resizing
   */
  const startResize = (e: React.MouseEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      setIsResizing(true);
      initialX.current = e.clientX;
      initialLeftWidth.current = containerRef.current.offsetWidth * (columnSizes.left / 100);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }
  };

  /**
   * Performs resizing by adjusting column width based on mouse position.
   * 
   * @param {MouseEvent} e - The mouse event during movement
   */
  const doResize = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const deltaX = e.clientX - initialX.current;
    let newLeftWidth = initialLeftWidth.current + deltaX;

    // Ensure minimum widths
    newLeftWidth = Math.max(leftColumnMinWidth, newLeftWidth);
    newLeftWidth = Math.min(containerWidth - rightColumnMinWidth, newLeftWidth);
    
    const leftPercentage = (newLeftWidth / containerWidth) * 100;
    const rightPercentage = 100 - leftPercentage;
    
    setColumnSizes({
      left: leftPercentage,
      right: rightPercentage
    });
  }, [isResizing, leftColumnMinWidth, rightColumnMinWidth]);

  /**
   * Stops the resize process and resets styling to normal.
   */
  const stopResize = useCallback(() => {
    if (!isResizing) return;
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    // The debounceSaveLayoutPreference will be called by the useEffect that watches isResizing
  }, [isResizing]);

  /**
   * Effect for adding and removing event listeners during resizing.
   */
  useEffect(() => {
    if (isResizing) {
      globalThis.addEventListener('mousemove', doResize);
      globalThis.addEventListener('mouseup', stopResize);
    }
    
    return () => {
      globalThis.removeEventListener('mousemove', doResize);
      globalThis.removeEventListener('mouseup', stopResize);
    };
  }, [isResizing, doResize, stopResize]);

  return {
    columnSizes,
    containerRef,
    startResize,
    isResizing,
  };
} 