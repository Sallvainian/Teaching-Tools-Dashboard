<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	import { addCalendarEventNotification } from '$lib/stores/notifications';

	// Types
	type ViewMode = 'month' | 'week' | 'day' | 'agenda';
	type EventCategory = 'default' | 'class' | 'meeting' | 'personal' | 'holiday';
	
	interface CalendarEvent {
		id: string;
		title: string;
		date: Date;
		startTime?: string;
		endTime?: string;
		description?: string;
		category: EventCategory;
		location?: string;
		isAllDay: boolean;
		recurring?: 'none' | 'daily' | 'weekly' | 'monthly';
		color?: string;
	}

	// Calendar state
	let currentDate = $state(new Date());
	let selectedDate = $state(new Date());
	let viewMode = $state<ViewMode>('month');
	let events = $state<CalendarEvent[]>([]);
	let showAddEventModal = $state(false);
	let showEventDetailsModal = $state(false);
	let selectedEvent = $state<CalendarEvent | null>(null);
	let editingEvent = $state(false);
	let showMiniCalendar = $state(true);
	let draggedEvent = $state<CalendarEvent | null>(null);
	
	// Form state
	let newEventTitle = $state('');
	let newEventDate = $state('');
	let newEventStartTime = $state('');
	let newEventEndTime = $state('');
	let newEventDescription = $state('');
	let newEventCategory = $state<EventCategory>('default');
	let newEventLocation = $state('');
	let newEventIsAllDay = $state(false);
	let newEventRecurring = $state<'none' | 'daily' | 'weekly' | 'monthly'>('none');

	// Category colors
	const categoryColors = {
		default: 'bg-blue-500',
		class: 'bg-green-500',
		meeting: 'bg-purple-500',
		personal: 'bg-orange-500',
		holiday: 'bg-red-500'
	};

	const categoryBgColors = {
		default: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
		class: 'bg-green-500/20 border-green-500/50 text-green-400',
		meeting: 'bg-purple-500/20 border-purple-500/50 text-purple-400',
		personal: 'bg-orange-500/20 border-orange-500/50 text-orange-400',
		holiday: 'bg-red-500/20 border-red-500/50 text-red-400'
	};

	// Calendar navigation
	function navigate(direction: -1 | 1) {
		switch (viewMode) {
			case 'month':
				currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1);
				break;
			case 'week':
				currentDate = new Date(currentDate.setDate(currentDate.getDate() + (direction * 7)));
				break;
			case 'day':
				currentDate = new Date(currentDate.setDate(currentDate.getDate() + direction));
				break;
		}
	}

	function goToToday() {
		currentDate = new Date();
		selectedDate = new Date();
	}

	// Calendar grid generation
	function getCalendarDays() {
		const year = currentDate.getFullYear();
		const month = currentDate.getMonth();
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const startDate = new Date(firstDay);
		startDate.setDate(startDate.getDate() - firstDay.getDay());

		const days = [];
		for (let i = 0; i < 42; i++) {
			const date = new Date(startDate);
			date.setDate(startDate.getDate() + i);
			days.push({
				date,
				isCurrentMonth: date.getMonth() === month,
				isToday: isSameDay(date, new Date()),
				isSelected: isSameDay(date, selectedDate),
				events: getEventsForDate(date)
			});
		}
		return days;
	}

	function getWeekDays() {
		const startOfWeek = new Date(currentDate);
		startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

		const days = [];
		for (let i = 0; i < 7; i++) {
			const date = new Date(startOfWeek);
			date.setDate(startOfWeek.getDate() + i);
			days.push({
				date,
				isToday: isSameDay(date, new Date()),
				isSelected: isSameDay(date, selectedDate),
				events: getEventsForDate(date)
			});
		}
		return days;
	}

	function getTimeSlots() {
		const slots = [];
		for (let hour = 0; hour < 24; hour++) {
			slots.push({
				hour,
				label: hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`
			});
		}
		return slots;
	}

	// Helper functions
	function isSameDay(date1: Date, date2: Date) {
		return date1.toDateString() === date2.toDateString();
	}

	function getEventsForDate(date: Date) {
		return events.filter(event => {
			if (event.recurring === 'daily') return true;
			if (event.recurring === 'weekly' && event.date.getDay() === date.getDay()) return true;
			if (event.recurring === 'monthly' && event.date.getDate() === date.getDate()) return true;
			return isSameDay(event.date, date);
		});
	}

	function getEventsForHour(date: Date, hour: number) {
		return getEventsForDate(date).filter(event => {
			if (event.isAllDay) return false;
			const eventHour = parseInt(event.startTime?.split(':')[0] || '0');
			return eventHour === hour;
		});
	}

	// Event management
	function addEvent() {
		if (!newEventTitle.trim() || !newEventDate) {
			return;
		}

		// Create proper event date and time
		let eventDate: Date;
		if (newEventIsAllDay) {
			// For all-day events, create date at noon local time to avoid timezone issues
			eventDate = new Date(newEventDate + 'T12:00:00');
		} else if (newEventStartTime) {
			// For timed events, combine date and time
			eventDate = new Date(newEventDate + 'T' + newEventStartTime + ':00');
		} else {
			// Fallback: create at noon local time
			eventDate = new Date(newEventDate + 'T12:00:00');
		}

		const event: CalendarEvent = {
			id: crypto.randomUUID(),
			title: newEventTitle.trim(),
			date: eventDate,
			startTime: newEventIsAllDay ? undefined : newEventStartTime,
			endTime: newEventIsAllDay ? undefined : newEventEndTime,
			description: newEventDescription.trim() || undefined,
			category: newEventCategory,
			location: newEventLocation.trim() || undefined,
			isAllDay: newEventIsAllDay,
			recurring: newEventRecurring,
			color: categoryColors[newEventCategory]
		};

		events = [...events, event];
		
		// Create notification for the event
		addCalendarEventNotification(event.title, event.date, event.id);
		
		clearEventForm();
		showAddEventModal = false;
	}

	function updateEvent() {
		if (!selectedEvent || !newEventTitle.trim()) return;

		// Create proper event date and time
		let eventDate: Date;
		if (newEventIsAllDay) {
			// For all-day events, create date at noon local time to avoid timezone issues
			eventDate = new Date(newEventDate + 'T12:00:00');
		} else if (newEventStartTime) {
			// For timed events, combine date and time
			eventDate = new Date(newEventDate + 'T' + newEventStartTime + ':00');
		} else {
			// Fallback: create at noon local time
			eventDate = new Date(newEventDate + 'T12:00:00');
		}

		const updatedEvent: CalendarEvent = {
			...selectedEvent,
			title: newEventTitle.trim(),
			date: eventDate,
			startTime: newEventIsAllDay ? undefined : newEventStartTime,
			endTime: newEventIsAllDay ? undefined : newEventEndTime,
			description: newEventDescription.trim() || undefined,
			category: newEventCategory,
			location: newEventLocation.trim() || undefined,
			isAllDay: newEventIsAllDay,
			recurring: newEventRecurring,
			color: categoryColors[newEventCategory]
		};

		events = events.map(e => e.id === selectedEvent?.id ? updatedEvent : e);
		selectedEvent = updatedEvent;
		editingEvent = false;
	}

	function deleteEvent(eventId: string) {
		events = events.filter(e => e.id !== eventId);
		showEventDetailsModal = false;
		selectedEvent = null;
	}

	function clearEventForm() {
		newEventTitle = '';
		newEventDate = '';
		newEventStartTime = '';
		newEventEndTime = '';
		newEventDescription = '';
		newEventCategory = 'default';
		newEventLocation = '';
		newEventIsAllDay = false;
		newEventRecurring = 'none';
	}

	function selectDate(date: Date) {
		selectedDate = date;
		if (viewMode === 'month') {
			viewMode = 'day';
			currentDate = date;
		}
	}

	function openAddEventModal(date?: Date) {
		if (date) {
			selectedDate = date;
			newEventDate = date.toISOString().split('T')[0];
		} else {
			newEventDate = selectedDate.toISOString().split('T')[0];
		}
		showAddEventModal = true;
	}

	function openEventDetails(event: CalendarEvent) {
		selectedEvent = event;
		showEventDetailsModal = true;
		editingEvent = false;
	}

	function startEditEvent() {
		if (!selectedEvent) return;
		newEventTitle = selectedEvent.title;
		newEventDate = selectedEvent.date.toISOString().split('T')[0];
		newEventStartTime = selectedEvent.startTime || '';
		newEventEndTime = selectedEvent.endTime || '';
		newEventDescription = selectedEvent.description || '';
		newEventCategory = selectedEvent.category;
		newEventLocation = selectedEvent.location || '';
		newEventIsAllDay = selectedEvent.isAllDay;
		newEventRecurring = selectedEvent.recurring || 'none';
		editingEvent = true;
	}

	// Drag and drop
	function handleDragStart(event: DragEvent, calendarEvent: CalendarEvent) {
		draggedEvent = calendarEvent;
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
	}

	function handleDrop(event: DragEvent, date: Date) {
		event.preventDefault();
		if (draggedEvent) {
			const updatedEvent = { ...draggedEvent, date };
			events = events.map(e => e.id === draggedEvent?.id ? updatedEvent : e);
			draggedEvent = null;
		}
	}

	// Format helpers
	function formatMonth(date: Date) {
		return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
	}

	function formatWeek(date: Date) {
		const startOfWeek = new Date(date);
		startOfWeek.setDate(date.getDate() - date.getDay());
		const endOfWeek = new Date(startOfWeek);
		endOfWeek.setDate(startOfWeek.getDate() + 6);
		
		const format: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
		return `${startOfWeek.toLocaleDateString('en-US', format)} - ${endOfWeek.toLocaleDateString('en-US', format)}, ${startOfWeek.getFullYear()}`;
	}

	function formatDay(date: Date) {
		return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
	}

	function formatTime(time: string) {
		if (!time) return '';
		const [hours, minutes] = time.split(':');
		const hour = parseInt(hours);
		const ampm = hour >= 12 ? 'PM' : 'AM';
		const displayHour = hour % 12 || 12;
		return `${displayHour}:${minutes} ${ampm}`;
	}

	function formatEventTime(event: CalendarEvent) {
		if (event.isAllDay) return 'All day';
		const start = formatTime(event.startTime || '');
		const end = formatTime(event.endTime || '');
		return end ? `${start} - ${end}` : start;
	}

	// Persistence
	onMount(() => {
		const savedEvents = localStorage.getItem('calendar-events');
		if (savedEvents) {
			try {
				const parsed = JSON.parse(savedEvents);
				events = parsed.map((e: any) => ({ ...e, date: new Date(e.date) }));
			} catch (error) {
				console.error('Failed to load events:', error);
			}
		}
	});

	$effect(() => {
		localStorage.setItem('calendar-events', JSON.stringify(events));
	});
</script>

<svelte:head>
	<title>Calendar - Teacher Dashboard</title>
</svelte:head>

<div class="h-full flex flex-col bg-bg-base">
	<!-- Header -->
	<div class="bg-card border-b border-border px-6 py-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-4">
				<h1 class="text-2xl font-semibold text-text-base">Calendar</h1>
				
				<!-- Navigation -->
				<div class="flex items-center gap-2">
					<button
						onclick={goToToday}
						class="px-3 py-1.5 text-sm font-medium text-text-base bg-card border border-border rounded-md hover:bg-purple-bg transition-colors"
					>
						Today
					</button>
					<div class="flex items-center">
						<button
							onclick={() => navigate(-1)}
							class="p-1.5 text-muted hover:bg-purple-bg rounded-md transition-colors"
							aria-label="Previous period"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
							</svg>
						</button>
						<button
							onclick={() => navigate(1)}
							class="p-1.5 text-muted hover:bg-purple-bg rounded-md transition-colors"
							aria-label="Next period"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
							</svg>
						</button>
					</div>
					<h2 class="text-xl font-medium text-text-base">
						{#if viewMode === 'month'}
							{formatMonth(currentDate)}
						{:else if viewMode === 'week'}
							{formatWeek(currentDate)}
						{:else if viewMode === 'day'}
							{formatDay(currentDate)}
						{/if}
					</h2>
				</div>
			</div>

			<div class="flex items-center gap-3">
				<!-- View Toggle -->
				<div class="flex bg-bg-base rounded-md p-1">
					{#each ['day', 'week', 'month', 'agenda'] as mode}
						<button
							onclick={() => viewMode = mode as ViewMode}
							class="px-3 py-1 text-sm font-medium rounded transition-colors capitalize"
							class:bg-card={viewMode === mode}
							class:shadow-sm={viewMode === mode}
							class:text-text-base={viewMode === mode}
							class:text-muted={viewMode !== mode}
						>
							{mode}
						</button>
					{/each}
				</div>

				<!-- Add Event Button -->
				<button
					onclick={() => openAddEventModal()}
					class="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
					</svg>
					Create
				</button>
			</div>
		</div>
	</div>

	<!-- Main Content -->
	<div class="flex-1 flex overflow-hidden">
		<!-- Sidebar -->
		<div class="w-64 bg-card border-r border-border p-4 overflow-y-auto">
			<!-- Mini Calendar -->
			{#if showMiniCalendar}
				<div class="mb-6">
					<div class="flex items-center justify-between mb-2">
						<h3 class="text-sm font-medium text-text-base">
							{new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
						</h3>
					</div>
					<div class="grid grid-cols-7 gap-0.5 text-xs">
						{#each ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as day}
							<div class="text-center text-muted p-1">{day}</div>
						{/each}
						{#each getCalendarDays().slice(0, 35) as day}
							<button
								onclick={() => selectDate(day.date)}
								class="p-1 text-center rounded hover:bg-purple-bg transition-colors"
								class:text-muted={!day.isCurrentMonth}
								class:bg-purple-bg={day.isSelected}
								class:text-purple-400={day.isSelected}
								class:font-medium={day.isToday}
								class:text-blue-400={day.isToday && !day.isSelected}
							>
								{day.date.getDate()}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Event Categories -->
			<div>
				<h3 class="text-sm font-medium text-text-base mb-3">Categories</h3>
				<div class="space-y-2">
					{#each Object.entries(categoryColors) as [category, color]}
						<label class="flex items-center gap-2 cursor-pointer">
							<input type="checkbox" checked class="rounded text-purple-600 bg-bg-base border-border" />
							<div class="w-3 h-3 rounded-full {color}"></div>
							<span class="text-sm text-muted capitalize">{category}</span>
						</label>
					{/each}
				</div>
			</div>
		</div>

		<!-- Calendar View -->
		<div class="flex-1 bg-card overflow-auto">
			{#if viewMode === 'month'}
				<!-- Month View -->
				<div class="h-full flex flex-col">
					<!-- Days of Week Header -->
					<div class="grid grid-cols-7 border-b border-border">
						{#each ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as day}
							<div class="p-2 text-center text-sm font-medium text-muted border-r border-border last:border-r-0">
								{day}
							</div>
						{/each}
					</div>

					<!-- Calendar Grid -->
					<div class="flex-1 grid grid-cols-7 grid-rows-6">
						{#each getCalendarDays() as day}
							<div
								class="border-r border-b border-border last:border-r-0 p-2 min-h-[100px]"
								class:bg-bg-base={!day.isCurrentMonth}
								ondragover={handleDragOver}
								ondrop={(e) => handleDrop(e, day.date)}
								role="gridcell"
								tabindex={0}
							>
								<button
									onclick={() => selectDate(day.date)}
									class="w-full text-left"
								>
									<div class="flex items-start justify-between mb-1">
										<span 
											class="text-sm font-medium"
											class:text-muted={!day.isCurrentMonth}
											class:text-blue-400={day.isToday}
										>
											{day.date.getDate()}
										</span>
										{#if day.isToday}
											<span class="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Today</span>
										{/if}
									</div>
								</button>
								
								<div class="space-y-1">
									{#each day.events.slice(0, 3) as event}
										<button
											onclick={() => openEventDetails(event)}
											draggable="true"
											ondragstart={(e) => handleDragStart(e, event)}
											class="w-full text-left text-xs p-1 rounded border {categoryBgColors[event.category]} truncate hover:opacity-80 transition-opacity"
										>
											{#if event.startTime && !event.isAllDay}
												<span class="font-medium">{formatTime(event.startTime)}</span>
											{/if}
											{event.title}
										</button>
									{/each}
									{#if day.events.length > 3}
										<button
											onclick={() => selectDate(day.date)}
											class="text-xs text-muted hover:text-text-base"
										>
											+{day.events.length - 3} more
										</button>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>

			{:else if viewMode === 'week'}
				<!-- Week View -->
				<div class="h-full flex flex-col">
					<!-- Days Header -->
					<div class="grid grid-cols-8 border-b border-border sticky top-0 bg-card z-10">
						<div class="p-2 border-r border-border"></div>
						{#each getWeekDays() as day}
							<div class="p-2 text-center border-r border-border last:border-r-0">
								<div class="text-xs text-muted">
									{day.date.toLocaleDateString('en-US', { weekday: 'short' })}
								</div>
								<div 
									class="text-2xl font-medium mt-1"
									class:text-blue-400={day.isToday}
								>
									{day.date.getDate()}
								</div>
							</div>
						{/each}
					</div>

					<!-- Time Grid -->
					<div class="flex-1 overflow-y-auto">
						<div class="grid grid-cols-8">
							{#each getTimeSlots() as slot}
								<div class="border-b border-r border-border p-2 text-xs text-muted text-right">
									{slot.label}
								</div>
								{#each getWeekDays() as day}
									<div 
										class="border-b border-r border-border last:border-r-0 relative min-h-[60px]"
										ondragover={handleDragOver}
										ondrop={(e) => handleDrop(e, day.date)}
										role="gridcell"
										tabindex={0}
									>
										{#each getEventsForHour(day.date, slot.hour) as event}
											<button
												onclick={() => openEventDetails(event)}
												draggable="true"
												ondragstart={(e) => handleDragStart(e, event)}
												class="absolute inset-x-1 text-xs p-1 rounded {categoryBgColors[event.category]} border hover:opacity-80 transition-opacity"
												style="top: 2px;"
											>
												<div class="font-medium truncate">{event.title}</div>
												<div class="text-xs">{formatEventTime(event)}</div>
											</button>
										{/each}
									</div>
								{/each}
							{/each}
						</div>
					</div>
				</div>

			{:else if viewMode === 'day'}
				<!-- Day View -->
				<div class="h-full flex flex-col">
					<!-- Day Header -->
					<div class="border-b border-border p-4 bg-card sticky top-0 z-10">
						<h2 class="text-xl font-medium text-text-base">
							{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
						</h2>
					</div>

					<!-- Time Grid -->
					<div class="flex-1 overflow-y-auto">
						<div class="min-h-full">
							{#each getTimeSlots() as slot}
								<div class="flex border-b border-border">
									<div class="w-20 p-2 text-xs text-muted text-right border-r border-border">
										{slot.label}
									</div>
									<div 
										class="flex-1 relative min-h-[60px] p-2"
										ondragover={handleDragOver}
										ondrop={(e) => handleDrop(e, selectedDate)}
										role="gridcell"
									>	tabindex={0}

										{#each getEventsForHour(selectedDate, slot.hour) as event}
											<button
												onclick={() => openEventDetails(event)}
												draggable="true"
												ondragstart={(e) => handleDragStart(e, event)}
												class="w-full text-left mb-1 p-2 rounded {categoryBgColors[event.category]} border hover:opacity-80 transition-opacity"
											>
												<div class="font-medium">{event.title}</div>
												<div class="text-sm">{formatEventTime(event)}</div>
												{#if event.location}
													<div class="text-sm opacity-75">{event.location}</div>
												{/if}
											</button>
										{/each}
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>

			{:else if viewMode === 'agenda'}
				<!-- Agenda View -->
				<div class="h-full overflow-y-auto p-6">
					<h2 class="text-xl font-medium text-text-base mb-4">Upcoming Events</h2>
					<div class="space-y-4">
						{#each events.sort((a, b) => a.date.getTime() - b.date.getTime()) as event}
							<div class="bg-bg-base border border-border rounded-lg p-4 hover:bg-purple-bg transition-colors">
								<div class="flex items-start justify-between">
									<div class="flex-1">
										<div class="flex items-center gap-2 mb-2">
											<div class="w-3 h-3 rounded-full {categoryColors[event.category]}"></div>
											<h3 class="font-medium text-text-base">{event.title}</h3>
										</div>
										<div class="text-sm text-muted space-y-1">
											<div class="flex items-center gap-2">
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
												</svg>
												{event.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
											</div>
											{#if event.startTime}
												<div class="flex items-center gap-2">
													<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
													</svg>
													{formatEventTime(event)}
												</div>
											{/if}
											{#if event.location}
												<div class="flex items-center gap-2">
													<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
													</svg>
													{event.location}
												</div>
											{/if}
											{#if event.description}
												<p class="mt-2">{event.description}</p>
											{/if}
										</div>
									</div>
									<button
										onclick={() => openEventDetails(event)}
										class="p-2 text-muted hover:text-text-base transition-colors"
										aria-label="View event details"
									>
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
										</svg>
									</button>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Add/Edit Event Modal -->
{#if showAddEventModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" transition:fade={{ duration: 200 }}>
		<div class="bg-card rounded-lg shadow-xl w-full max-w-md mx-4" transition:slide={{ duration: 200 }}>
			<div class="p-6">
				<h3 class="text-lg font-medium text-text-base mb-4">Create Event</h3>

				<div class="space-y-4">
					<div>
						<input
							bind:value={newEventTitle}
							type="text"
							placeholder="Add title"
							class="w-full px-3 py-2 text-lg border-0 border-b-2 border-border focus:border-purple-500 focus:outline-none transition-colors bg-card text-text-base"
						/>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="event-date" class="block text-sm font-medium text-muted mb-1">Date</label>
							<input
								id="event-date"
								bind:value={newEventDate}
								type="date"
								class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-bg-base text-text-base"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-muted mb-1">Category</label>
							<select
								bind:value={newEventCategory}
								class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-bg-base text-text-base"
							>
								{#each Object.keys(categoryColors) as category}
									<option value={category}>{category.charAt(0).toUpperCase() + category.slice(1)}</option>
								{/each}
							</select>
						</div>
					</div>

					<div>
						<label class="flex items-center gap-2">
							<input
								bind:checked={newEventIsAllDay}
								type="checkbox"
								class="rounded text-purple-600 bg-bg-base border-border"
							/>
							<span class="text-sm font-medium text-muted">All day</span>
						</label>
					</div>

					{#if !newEventIsAllDay}
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label class="block text-sm font-medium text-muted mb-1">Start time</label>
								<input
									bind:value={newEventStartTime}
									type="time"
									class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-bg-base text-text-base"
								/>
							</div>
							<div>
								<label class="block text-sm font-medium text-muted mb-1">End time</label>
								<input
									bind:value={newEventEndTime}
									type="time"
									class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-bg-base text-text-base"
								/>
							</div>
						</div>
					{/if}

					<div>
						<label class="block text-sm font-medium text-muted mb-1">Location</label>
						<input
							bind:value={newEventLocation}
							type="text"
							placeholder="Add location"
							class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-bg-base text-text-base"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-muted mb-1">Description</label>
						<textarea
							bind:value={newEventDescription}
							placeholder="Add description"
							rows="3"
							class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none bg-bg-base text-text-base"
						></textarea>
					</div>

					<div>
						<label class="block text-sm font-medium text-muted mb-1">Repeat</label>
						<select
							bind:value={newEventRecurring}
							class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-bg-base text-text-base"
						>
							<option value="none">Does not repeat</option>
							<option value="daily">Daily</option>
							<option value="weekly">Weekly</option>
							<option value="monthly">Monthly</option>
						</select>
					</div>
				</div>
			</div>

			<div class="bg-bg-base px-6 py-3 flex justify-end gap-3 rounded-b-lg">
				<button
					onclick={() => { showAddEventModal = false; clearEventForm(); }}
					class="px-4 py-2 text-sm font-medium bg-card border border-border text-text-base hover:bg-surface transition-colors rounded-md"
				>
					Cancel
				</button>
				<button
					onclick={addEvent}
					class="px-4 py-2 bg-purple text-highlight text-sm font-medium rounded-md hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={!newEventTitle.trim() || !newEventDate}
				>
					Save {newEventTitle.trim() ? '✓' : '❌'} {newEventDate ? '✓' : '❌'}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Event Details Modal -->
{#if showEventDetailsModal && selectedEvent}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" transition:fade={{ duration: 200 }}>
		<div class="bg-card rounded-lg shadow-xl w-full max-w-md mx-4" transition:slide={{ duration: 200 }}>
			{#if !editingEvent}
				<!-- View Mode -->
				<div class="p-6">
					<div class="flex items-start justify-between mb-4">
						<div class="flex items-center gap-3">
							<div class="w-4 h-4 rounded-full {categoryColors[selectedEvent.category]}"></div>
							<h3 class="text-xl font-medium text-text-base">{selectedEvent.title}</h3>
						</div>
						<!-- svelte-ignore a11y_consider_explicit_label -->
						<button
							onclick={() => showEventDetailsModal = false}
							class="text-muted hover:text-text-base transition-colors"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>

					<div class="space-y-3 text-sm text-muted">
						<div class="flex items-center gap-3">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
							<span>{selectedEvent.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
						</div>

						{#if selectedEvent.startTime || selectedEvent.isAllDay}
							<div class="flex items-center gap-3">
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								<span>{formatEventTime(selectedEvent)}</span>
							</div>
						{/if}

						{#if selectedEvent.location}
							<div class="flex items-center gap-3">
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
								</svg>
								<span>{selectedEvent.location}</span>
							</div>
						{/if}

						{#if selectedEvent.recurring && selectedEvent.recurring !== 'none'}
							<div class="flex items-center gap-3">
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
								</svg>
								<span>Repeats {selectedEvent.recurring}</span>
							</div>
						{/if}

						{#if selectedEvent.description}
							<div class="pt-3 border-t border-border">
								<p class="text-text-base">{selectedEvent.description}</p>
							</div>
						{/if}
					</div>
				</div>

				<div class="bg-bg-base px-6 py-3 flex justify-between rounded-b-lg">
					<button
						onclick={() => selectedEvent && deleteEvent(selectedEvent.id)}
						class="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
					>
						Delete
					</button>
					<button
						onclick={startEditEvent}
						class="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors"
					>
						Edit
					</button>
				</div>
			{:else}
				<!-- Edit Mode -->
				<div class="p-6">
					<h3 class="text-lg font-medium text-text-base mb-4">Edit Event</h3>

					<div class="space-y-4">
						<div>
							<input
								bind:value={newEventTitle}
								type="text"
								placeholder="Add title"
								class="w-full px-3 py-2 text-lg border-0 border-b-2 border-border focus:border-purple-500 focus:outline-none transition-colors bg-card text-text-base"
							/>
						</div>

						<div class="grid grid-cols-2 gap-4">
							<div>
								<label class="block text-sm font-medium text-muted mb-1">Date</label>
								<input
									bind:value={newEventDate}
									type="date"
									class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-bg-base text-text-base"
								/>
							</div>
							<div>
								<label class="block text-sm font-medium text-muted mb-1">Category</label>
								<select
									bind:value={newEventCategory}
									class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-bg-base text-text-base"
								>
									{#each Object.keys(categoryColors) as category}
										<option value={category}>{category.charAt(0).toUpperCase() + category.slice(1)}</option>
									{/each}
								</select>
							</div>
						</div>

						<div>
							<label class="flex items-center gap-2">
								<input
									bind:checked={newEventIsAllDay}
									type="checkbox"
									class="rounded text-purple-600 bg-bg-base border-border"
								/>
								<span class="text-sm font-medium text-muted">All day</span>
							</label>
						</div>

						{#if !newEventIsAllDay}
							<div class="grid grid-cols-2 gap-4">
								<div>
									<label class="block text-sm font-medium text-muted mb-1">Start time</label>
									<input
										bind:value={newEventStartTime}
										type="time"
										class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-bg-base text-text-base"
									/>
								</div>
								<div>
									<label class="block text-sm font-medium text-muted mb-1">End time</label>
									<input
										bind:value={newEventEndTime}
										type="time"
										class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-bg-base text-text-base"
									/>
								</div>
							</div>
						{/if}

						<div>
							<label class="block text-sm font-medium text-muted mb-1">Location</label>
							<input
								bind:value={newEventLocation}
								type="text"
								placeholder="Add location"
								class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-bg-base text-text-base"
							/>
						</div>

						<div>
							<label class="block text-sm font-medium text-muted mb-1">Description</label>
							<textarea
								bind:value={newEventDescription}
								placeholder="Add description"
								rows="3"
								class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none bg-bg-base text-text-base"
							></textarea>
						</div>

						<div>
							<label class="block text-sm font-medium text-muted mb-1">Repeat</label>
							<select
								bind:value={newEventRecurring}
								class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-bg-base text-text-base"
							>
								<option value="none">Does not repeat</option>
								<option value="daily">Daily</option>
								<option value="weekly">Weekly</option>
								<option value="monthly">Monthly</option>
							</select>
						</div>
					</div>
				</div>

				<div class="bg-bg-base px-6 py-3 flex justify-end gap-3 rounded-b-lg">
					<button
						onclick={() => editingEvent = false}
						class="px-4 py-2 text-sm font-medium bg-card border border-border text-text-base hover:bg-surface transition-colors rounded-md"
					>
						Cancel
					</button>
					<button
						onclick={updateEvent}
						class="px-4 py-2 bg-purple text-highlight text-sm font-medium rounded-md hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						disabled={!newEventTitle.trim()}
					>
						Save
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	/* Custom scrollbar for calendar views */
	:global(.overflow-y-auto) {
		scrollbar-width: thin;
		scrollbar-color: #4b5563 #1f2937;
	}

	:global(.overflow-y-auto::-webkit-scrollbar) {
		width: 8px;
	}

	:global(.overflow-y-auto::-webkit-scrollbar-track) {
		background: #1f2937;
	}

	:global(.overflow-y-auto::-webkit-scrollbar-thumb) {
		background-color: #4b5563;
		border-radius: 4px;
	}

	:global(.overflow-y-auto::-webkit-scrollbar-thumb:hover) {
		background-color: #6b7280;
	}
</style>