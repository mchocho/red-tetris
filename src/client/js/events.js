const logEvents = window.EVENTS

export default () =>
{
	const listeners = new Set();

	return {
		listen(name, callback)
		{
			if (logEvents)
				console.log('Event triggered: ', name);

			listeners.add({
				name,
				callback
			});
		},
		emit(name, ...data)
		{
			if (logEvents)
				console.log('Emitting event: ', name);

			listeners.forEach(listener =>
			{
				if (listener.name === name)
					listener.callback(...data);
			});
		}
	};
}