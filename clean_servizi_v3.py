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
    
    # Start at the first occurrence of data-inherit-lp-settings="1"
    start_tag = 'data-inherit-lp-settings="1"'
    start_index = content.find(start_tag)
    if start_index != -1:
        # Go back to find the opening <div of this tag
        start_index = content.rfind('<div', 0, start_index)
    else:
        print("Start marker not found")
        return

    # End before the GDPR modal or the copyscapeskip
    end_tag = '<dialog id="moove_gdpr_cookie_modal"'
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
    print(f"Extracted length: {len(main_html)} bytes")

if __name__ == "__main__":
    main()
