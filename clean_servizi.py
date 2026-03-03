import re
import os

def clean_bionic(text):
    # Remove tags like <br-fixation ...>, <br-span>, <br-bold>, <br-edge>
    # while keeping the inner text
    text = re.sub(r'</?br-(?:fixation|span|bold|edge)[^>]*>', '', text)
    return text

def main():
    source_path = r'D:\marcomunich.com\servizi_fresh.html'
    target_path = r'D:\marcomunich.com\src\pages\servizi.astro'
    
    with open(source_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract the main content. 
    # Let's look for the start of the first thrv-page-section or landingpage-top-section
    start_marker = '<div id="landingpage-top-section"'
    end_marker = '<div id="landingpage-bottom-section"'
    
    # If not found, try alternatives
    if start_marker not in content:
        start_marker = '<div data-inherit-lp-settings="1"'
    
    start_index = content.find(start_marker)
    if start_index == -1:
        print("Start marker not found")
        return

    # Find the end of landingpage-bottom-section
    end_index = content.find(end_marker)
    if end_index != -1:
        # Find the closing tag of landingpage-bottom-section
        # It's usually <div ...>...</div>
        next_div_end = content.find('</div>', end_index)
        if next_div_end != -1:
            end_index = next_div_end + 6
        else:
            end_index = len(content)
    else:
        # Fallback: find the end of the last thrive section or before body ends
        end_index = content.find('</body>')
        if end_index == -1:
            end_index = len(content)

    main_html = content[start_index:end_index]
    
    # Clean it
    clean_html = clean_bionic(main_html)
    
    # Prepare the Astro content
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
    
    final_astro = astro_template.replace('{{CLEAN_HTML}}', clean_html.replace('`', '\\`'))
    
    with open(target_path, 'w', encoding='utf-8') as f:
        f.write(final_astro)
    
    print(f"Successfully cleaned and updated {target_path}")

if __name__ == "__main__":
    main()
