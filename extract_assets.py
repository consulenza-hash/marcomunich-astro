import re
import os
import sys

def clean_bionic(text):
    # Remove tags like <br-fixation ...>, <br-span>, <br-bold>, <br-edge>
    # while keeping the inner text
    text = re.sub(r'</?br-(?:fixation|span|bold|edge)[^>]*>', '', text)
    return text

def extract_content(html_content):
    # Try multiple start markers
    start_markers = [
        'id="tve_editor"',
        'class="tar-main-content"',
        'data-inherit-lp-settings="1"',
        'id="theme-content-section"'
    ]
    
    start_index = -1
    for marker in start_markers:
        idx = html_content.find(marker)
        if idx != -1:
            # Go back to find the opening <div of this tag
            start_index = html_content.rfind('<div', 0, idx)
            if start_index != -1:
                print(f"Found start marker: {marker} at index {idx}")
                break
    
    if start_index == -1:
        return None

    # End before the GDPR modal or the copyscapeskip or footer
    end_markers = [
        '<dialog id="moove_gdpr_cookie_modal"',
        '<!--copyscapeskip-->',
        '<footer',
        '<aside id="moove_gdpr_cookie_info_bar"',
        '<div id="moove_gdpr_cookie_info_bar"'
    ]
    
    end_index = len(html_content)
    for marker in end_markers:
        idx = html_content.find(marker)
        if idx != -1 and idx > start_index and idx < end_index:
            end_index = idx
            print(f"Found end marker: {marker} at index {idx}")

    main_html = html_content[start_index:end_index]
    return clean_bionic(main_html)

def extract_css(html_content):
    css_parts = []
    
    # Extract tcb-lightspeed-style
    lightspeed_styles = re.findall(r'<style[^>]*class="[^"]*tcb-lightspeed-style[^"]*"[^>]*>(.*?)</style>', html_content, re.DOTALL)
    css_parts.extend(lightspeed_styles)
    
    # Extract tve_custom_style
    custom_styles = re.findall(r'<style[^>]*class="[^"]*tve_custom_style"[^>]*>(.*?)</style>', html_content, re.DOTALL)
    css_parts.extend(custom_styles)
    
    # Extract other tve styles
    other_styles = re.findall(r'<style[^>]*id="tve-main-ls-grid-style"[^>]*>(.*?)</style>', html_content, re.DOTALL)
    css_parts.extend(other_styles)
    
    # Extract styles with id="tve-custom-css"
    custom_css_tags = re.findall(r'<style[^>]*id="tve-custom-css"[^>]*>(.*?)</style>', html_content, re.DOTALL)
    css_parts.extend(custom_css_tags)

    return "\n".join(css_parts)

def migrate_page(input_html_path, slug, title, description):
    if not os.path.exists(input_html_path):
        print(f"File not found: {input_html_path}")
        return

    print(f"Processing {input_html_path}...")
    with open(input_html_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    html_part = extract_content(content)
    if not html_part:
        print(f"Could not extract HTML content from {input_html_path}")
        return

    css_part = extract_css(content)
    
    # Save CSS to public/thrive/
    css_filename = f"{slug}.css"
    css_path = os.path.join(r'D:\marcomunich.com\public\thrive', css_filename)
    with open(css_path, 'w', encoding='utf-8') as f:
        f.write(css_part)
    print(f"Saved CSS to {css_path}")

    # Generate Astro file
    astro_template = '''---
import BaseLayout from '@layouts/BaseLayout.astro';
---

<BaseLayout
  title="{{TITLE}} - Marco Munich"
  description="{{DESCRIPTION}}"
  currentPath="/{{SLUG}}/"
>
  <link slot="head" rel="stylesheet" href="/thrive/{{SLUG}}.css" />

  <div class="thrive-page-wrap">
    <Fragment set:html={`{{CLEAN_HTML}}`} />
  </div>
</BaseLayout>

<style>
  .thrive-page-wrap {
    overflow-x: hidden;
  }
</style>
'''
    final_astro = astro_template
    final_astro = final_astro.replace('{{TITLE}}', title)
    final_astro = final_astro.replace('{{DESCRIPTION}}', description)
    final_astro = final_astro.replace('{{SLUG}}', slug)
    
    # Escape backticks in HTML for the JS template literal
    escaped_html = html_part.replace('`', '\\`').replace('${', '\\${')
    final_astro = final_astro.replace('{{CLEAN_HTML}}', escaped_html)
    
    astro_path = os.path.join(r'D:\marcomunich.com\src\pages', f"{slug}.astro")
    with open(astro_path, 'w', encoding='utf-8') as f:
        f.write(final_astro)
    print(f"Saved Astro page to {astro_path}")

if __name__ == "__main__":
    if len(sys.argv) < 5:
        print("Usage: python extract_assets.py <input_html> <slug> <title> <description>")
    else:
        migrate_page(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])
