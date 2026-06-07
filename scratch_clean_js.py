import os

def clean_js_file(filepath):
    print(f"Cleaning duplicates and fixing syntax in {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Fix the async async async performSummonToSlot declaration
    # We will replace any chain of async functions with a single one
    content = content.replace("async async async function performSummonToSlot", "async function performSummonToSlot")
    content = content.replace("async async function performSummonToSlot", "async function performSummonToSlot")
    
    # 2. Locate the showXLWConfirm function end and the Graveyard section start
    # showXLWConfirm ends with:
    #     overlay.querySelector("#xlwConfirmNo").onclick = () => {
    #       overlay.remove();
    #       resolve(false);
    #     };
    #   });
    # }
    
    confirm_end_sig = 'overlay.querySelector("#xlwConfirmNo").onclick = () => {\n      overlay.remove();\n      resolve(false);\n    };\n  });\n}'
    if confirm_end_sig not in content:
        confirm_end_sig = 'overlay.querySelector("#xlwConfirmNo").onclick = () => {\r\n      overlay.remove();\r\n      resolve(false);\r\n    };\r\n  });\r\n}'

    next_section_sig = '// ===== 新增：墓地渲染與對戰倒數機制 ====='
    
    start_idx = content.find(confirm_end_sig)
    end_idx = content.find(next_section_sig)
    
    if start_idx != -1 and end_idx != -1:
        # We will keep the confirm_end_sig, and then write exactly ONE showXLWChoiceModal function,
        # and then append the next_section_sig.
        before_modal = content[:start_idx + len(confirm_end_sig)]
        after_modal = content[end_idx:]
        
        single_modal_code = """

function showXLWChoiceModal(title, message, options) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "xlw-premium-choice-overlay";
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      backdrop-filter: blur(8px);
    `;

    const box = document.createElement("div");
    box.style.cssText = `
      background: linear-gradient(135deg, #1d1816 0%, #110e0d 100%);
      border: 2px solid var(--gold-accent);
      border-radius: 16px;
      width: 480px;
      max-width: 90vw;
      padding: 24px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.95), 0 0 20px rgba(205, 170, 82, 0.4);
      text-align: center;
      transform: scale(0.85);
      animation: xlwPopupScale 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    `;

    let buttonsHTML = "";
    options.forEach((opt) => {
      const isEnd = opt.value === "end_effects";
      const btnStyle = isEnd
        ? "background: rgba(255, 255, 255, 0.05); color: #c4b9a6; border: 1px solid rgba(255, 255, 255, 0.15);"
        : "background: rgba(205, 170, 82, 0.15); color: #ffd76a; border: 1.5px solid var(--gold-accent);";
      buttonsHTML += `
        <button class="xlw-choice-btn" data-value="${opt.value}" style="width: 100%; padding: 12px; font-size: 14px; margin-bottom: 10px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: all 0.2s ease; ${btnStyle}">
          ${opt.text}
        </button>
      `;
    });

    box.innerHTML = `
      <div style="font-size: 20px; font-weight: 900; color: #ffd76a; text-shadow: 0 0 10px rgba(255, 215, 106, 0.6); margin-bottom: 12px;">${title}</div>
      <div style="font-size: 14px; color: #c4b9a6; line-height: 1.6; margin-bottom: 20px;">${message}</div>
      <div style="display: flex; flex-direction: column; max-height: 300px; overflow-y: auto; padding-right: 4px;">
        ${buttonsHTML}
      </div>
    `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const cleanup = (val) => {
      overlay.remove();
      resolve(val);
    };

    box.querySelectorAll(".xlw-choice-btn").forEach(btn => {
      btn.onclick = () => {
        cleanup(btn.dataset.value);
      };
      btn.onmouseenter = () => {
        btn.style.filter = "brightness(1.2)";
        btn.style.transform = "translateY(-1px)";
      };
      btn.onmouseleave = () => {
        btn.style.filter = "none";
        btn.style.transform = "none";
      };
    });
  });
}

"""
        content = before_modal + single_modal_code + after_modal
        print("Cleaned up showXLWChoiceModal declarations successfully.")
    else:
        print("WARNING: Could not find start or end index for showXLWChoiceModal block.")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Finished cleaning {filepath}.\n")

clean_js_file('static/game_v8.js')
clean_js_file('static/game.js')
