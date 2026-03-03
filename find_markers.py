
import sys

def find_content(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        html = f.read()
    
    # Try common markers
    start_markers = [
        '<div class="tve-cb">',
        '<div class="thrive-page-wrap">',
        '<div class="entry-content">',
        '<article'
    ]
    
    end_markers = [
        '<footer',
        '<!-- #main -->',
        '<!-- .entry-content -->'
    ]
    
    print(f"File: {filename}")
    for start in start_markers:
        pos = html.find(start)
        if pos != -1:
            print(f"Found START marker '{start}' at {pos}")
            snippet = html[pos:pos+200].replace('\n', ' ')
            print(f"Snippet: {snippet}...")
            
    for end in end_markers:
        pos = html.find(end)
        if pos != -1:
            print(f"Found END marker '{end}' at {pos}")

if __name__ == "__main__":
    find_content(sys.argv[1])
