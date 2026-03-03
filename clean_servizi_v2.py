import re

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
    
    # We want to extract everything between the end of thrive-header and the start of thrive-footer
    # OR everything inside tar-main-content
    
    start_tag = '<div id="tve_editor" class="tve_shortcode_editor tar-main-content" data-post-id="5980">'
    end_tag = '<div id="thrive-footer"'
    
    start_index = content.find(start_tag)
    if start_index != -1:
        # Move start_index to after the start_tag
        start_index += len(start_tag)
        
        # But we want to skip the header if it's there
        header_end = content.find('</div></div></div></div></div></div></div></div>', start_index)
        # This is too brittle. 
        # Let's find the first thrv-page-section after tve_editor
        first_section = content.find('<div data-inherit-lp-settings="1"', start_index)
        if first_section != -1:
            start_index = first_section
    else:
        # Fallback
        start_index = content.find('<div data-inherit-lp-settings="1"')
        if start_index == -1:
            print("Start of content not found")
            return

    end_index = content.find(end_tag)
    if end_index == -1:
        end_index = content.find('<!--copyscapeskip-->')
        if end_index == -1:
            end_index = len(content)

    main_html = content[start_index:end_index]
    
    # Clean it
    clean_html = clean_bionic(main_html)
    
    # Final check for any weird artifacts in CONFIG blocks
    clean_html = clean_html.replace('__CONFIG_', '\n__CONFIG_')
    clean_html = clean_html.replace('_CONFIG__', '_CONFIG__\n')
    
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
    
    # Replace backticks and update template
    final_content = astro_template.replace('{{CLEAN_HTML}}', clean_html.replace('`', '\\`'))
    
    with open(target_path, 'w', encoding='utf-8') as f:
        f.write(final_content)
    
    print(f"Successfully cleaned and updated {target_path}")

if __name__ == "__main__":
    main()
