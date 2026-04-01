import { useState, useEffect } from 'react'
export function useTeamLock(matchId) { return { isLocked: false, timeLeft: null } }
export function TeamLockBanner() { return null }