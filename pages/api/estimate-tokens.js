export default async function handler(req, res) {
	if (req.method !== 'POST') {
		return res.status(405).json({ message: 'Method not allowed' });
	}

	try {
		const { text, model } = req.body || {};
		const input = typeof text === 'string' ? text : '';

		// Fallback heuristic
		const estimateHeuristic = (t) => {
			if (!t) return 0;
			const normalized = String(t).replace(/\s+/g, ' ').trim();
			if (!normalized) return 0;
			let tokens = 0;
			for (const segment of normalized.split(' ')) {
				if (!segment) continue;
				const sub = segment.split(/([.,;:!?(){}\[\]<>=+*\\\/-]|\p{P}+)/u).filter(Boolean);
				tokens += sub.length;
			}
			return tokens;
		};

		let count = 0;
		try {
			// Attempt to use @dqbd/tiktoken if available (avoids bundler static analysis)
			const reqFn = eval('require');
			const { get_encoding, encoding_for_model } = reqFn('@dqbd/tiktoken');
			let enc;
			if (model) {
				try { enc = encoding_for_model(model); } catch (_) { enc = get_encoding('cl100k_base'); }
			} else {
				enc = get_encoding('cl100k_base');
			}
			const tokens = enc.encode(input);
			count = Array.isArray(tokens) ? tokens.length : 0;
			enc.free && enc.free();
		} catch (_) {
			count = estimateHeuristic(input);
		}

		return res.status(200).json({ tokens: count });
	} catch (error) {
		console.error('estimate-tokens error:', error);
		return res.status(500).json({ message: 'Internal server error' });
	}
}


