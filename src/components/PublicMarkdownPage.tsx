import { useEffect, useState } from 'react';
import Markdown from 'react-markdown';

export const PublicMarkdownPage = ({ filePath }: { filePath: string }) => {
    const [markdownContent, setMarkdownContent] = useState('');
    // Define the path to your markdown file in the public folder

    useEffect(() => {
        fetch(filePath)
            .then((response) => response.text())
            .then((text) => setMarkdownContent(text))
            .catch((error) => console.error('Error fetching markdown file:', error));
    }, [filePath]); // Re-fetch if filePath changes

    return (
        <div className="markdown-container">
            <Markdown>{markdownContent}</Markdown>
        </div>
    );
}

export default PublicMarkdownPage;
