import { useEffect, useMemo, useState } from 'react';
import { isPastMatch } from '@/features/matches/utils/matchStatus';
import { groupFixturesByDay } from '../utils/predictionMatchGroups';

export function usePredictionDayGroups(visibleFixtures = []) {
  const dayGroups = useMemo(() => groupFixturesByDay(visibleFixtures), [visibleFixtures]);
  const dayKeys = useMemo(() => dayGroups.map((group) => group.key), [dayGroups]);

  const defaultDay = useMemo(() => {
    if (!dayGroups.length) return null;

    const live = dayGroups.find((group) => group.hasLive);
    const upcoming = dayGroups.find((group) => group.matches.some((match) => !isPastMatch(match)));
    return (live || upcoming || dayGroups[0]).key;
  }, [dayGroups]);

  const [selectedDay, setSelectedDay] = useState(null);

  // Commit the default day once fixtures are available, so background polls do
  // not move the user while they are browsing a specific match day.
  useEffect(() => {
    if (selectedDay === null && defaultDay) setSelectedDay(defaultDay);
  }, [selectedDay, defaultDay]);

  const activeDay =
    selectedDay === 'ALL'
      ? 'ALL'
      : selectedDay && dayKeys.includes(selectedDay)
        ? selectedDay
        : defaultDay;

  const groupsToRender = activeDay === 'ALL'
    ? dayGroups
    : dayGroups.filter((group) => group.key === activeDay);

  return {
    dayGroups,
    activeDay,
    setSelectedDay,
    groupsToRender,
  };
}
