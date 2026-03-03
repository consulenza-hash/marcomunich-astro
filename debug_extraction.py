import re

def clean_bionic(text):
    text = re.sub(r'</?br-(?:fixation|span|bold|edge)[^>]*>', '', text)
    return text

def main():
    source_path = r'D:\marcomunich.com\servizi_fresh.html'
    target_path = r'D:\marcomunich.com\src\pages\servizi.astro'
    
    with open(source_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Try finding the first thrive-header and skip it, or find the landing page content
    # In V2/V3 I tried data-inherit-lp-settings="1"
    
    marker = 'data-inherit-lp-settings="1"'
    pos = content.find(marker)
    if pos == -1:
        print("Marker not found")
        return
    
    # Let's just start a few characters before the marker where the <div might be
    start_index = content.rfind('<div', 0, pos)
    if start_index == -1:
        start_index = pos # fallback
    
    # End before the footer symbol
    end_tag = '<div id="thrive-footer"'
    end_index = content.find(end_tag)
    
    if end_index == -1:
        end_index = content.find('<!--copyscapeskip-->')
    
    if end_index == -1:
        end_index = len(content)

    main_html = content[start_index:end_index]
    print(f"Start index: {start_index}, End index: {end_index}")
    print(f"Extracted length: {len(main_html)}")
    
    if len(main_html) < 100:
        print("Warning: Extracted content is too short")
        # return # No, let's see what it is
    
    clean_html = clean_bionic(main_html)
    
    astro_template = r'''---
import BaseLayout from '@layouts/BaseLayout.astro';
---

<BaseLayout
  title="Servizi - Marco Munich"
  description="Servizi di Personal Branding Olistico di Marco Munich per coach, counselor e operatori olistici."
  currentPath="/servizi/"
>
  <link slot="head" rel="stylesheet" href="/thrive/servizi.css" />

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
    
    final_content = astro_template.replace('{{CLEAN_HTML}}', clean_html.replace('`', '\\`'))
    
    with open(target_path, 'w', encoding='utf-8') as f:
        f.write(final_content)
    
    print(f"Successfully cleaned and updated {target_path}")

if __name__ == "__main__":
    main()
