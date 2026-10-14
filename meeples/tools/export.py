import base64,json,sys
from playwright.sync_api import sync_playwright
js=open('tools/sprite-gen.js').read()
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page()
    pg.set_content('<html><body></body></html>');pg.add_script_tag(content=js)
    for s in (1,2):
        d=pg.evaluate(f'LabskinSprites.makeSheet({s}).canvas.toDataURL("image/png")')
        open(f'assets/labskin-meeples-{32*s}.png','wb').write(base64.b64decode(d.split(',')[1]))
    a=pg.evaluate('LabskinSprites.atlas()')
    json.dump(a,open('assets/labskin-meeples.json','w'),indent=1)
    robot=pg.evaluate('LabskinSprites.makeRobot().toDataURL("image/png")')
    open('assets/labskin-bot-32.png','wb').write(base64.b64decode(robot.split(',')[1]))
    b.close()
