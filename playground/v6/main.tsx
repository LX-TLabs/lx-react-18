import { useState } from 'react';
import ReactDOM from 'react-dom/client';

function App() {
	const [num, setNum] = useState(0)
	window.setNum = setNum
	return (
		<h3>
			<p>{num}</p>
		</h3>
	);
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<App />);
